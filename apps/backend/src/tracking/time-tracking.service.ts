import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TimeTracking, Prisma } from '@prisma/client';

@Injectable()
export class TimeTrackingService {
    private readonly logger = new Logger(TimeTrackingService.name);

    constructor(private prisma: PrismaService) { }

    /**
     * Start tracking time for a feedback cycle
     * Usually called when a feedback cycle is created or reopened
     */
    async startTracking(
        projectId: string,
        employeeId: string,
        feedbackCycleId: string,
        startTime: Date = new Date(),
    ): Promise<TimeTracking> {
        // Check if there's already an open tracking session for this cycle/employee
        const existing = await this.prisma.timeTracking.findFirst({
            where: {
                feedbackCycleId,
                employeeId,
                endTime: null,
            },
        });

        if (existing) {
            this.logger.warn(`Time tracking already active for cycle ${feedbackCycleId}`);
            return existing;
        }

        // Get project to check if we can track (optional validation)

        // Apply Strict 12:00 PM Rule (V2 Workflow)
        const officialStartTime = this.calculateOfficialStartTime(startTime);

        return this.prisma.timeTracking.create({
            data: {
                projectId,
                employeeId,
                feedbackCycleId,
                startTime: officialStartTime,
            },
        });
    }

    /**
     * Calculate Official Start Time based on V2 Rule:
     * - Before 12:00 PM -> Starts NEXT DAY at 9:00 AM
     * - After 12:00 PM -> Starts SAME DAY at current time
     */
    private calculateOfficialStartTime(inputDate: Date): Date {
        const hour = inputDate.getHours();

        // Before 12:00 PM
        if (hour < 12) {
            const nextDay = new Date(inputDate);
            nextDay.setDate(nextDay.getDate() + 1);
            nextDay.setHours(9, 0, 0, 0); // 9:00 AM
            this.logger.log(`Timer Rule Applied (<12PM): Input ${inputDate.toISOString()} -> Start ${nextDay.toISOString()}`);
            return nextDay;
        }

        // After 12:00 PM (Start immediately)
        this.logger.log(`Timer Rule Applied (>=12PM): Input ${inputDate.toISOString()} -> Start ${inputDate.toISOString()}`);
        return inputDate;
    }

    /**
     * End tracking time
     * Called when file is submitted or cycle is closed
     */
    async endTracking(
        feedbackCycleId: string,
        approvedFileId?: string,
        endTime: Date = new Date(),
    ): Promise<TimeTracking | null> {
        const activeTracking = await this.prisma.timeTracking.findFirst({
            where: {
                feedbackCycleId,
                endTime: null,
            },
        });

        if (!activeTracking) {
            // Can be valid if we are closing a cycle that wasn't being tracked or already closed
            return null;
        }

        const durationDays = this.calculateDurationDays(activeTracking.startTime, endTime);

        return this.prisma.timeTracking.update({
            where: { id: activeTracking.id },
            data: {
                endTime,
                durationDays,
                approvedFileId,
            },
        });
    }

    /**
     * Calculate duration in days (fractional)
     */
    private calculateDurationDays(start: Date, end: Date): number {
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        return parseFloat(diffDays.toFixed(2));
    }

    /**
     * Calculate duration breakdown (days, hours, minutes)
     */
    private calculateDurationBreakdown(start: Date, end: Date): { days: number; hours: number; minutes: number; totalDays: number } {
        const diffTime = Math.abs(end.getTime() - start.getTime());

        const totalDays = diffTime / (1000 * 60 * 60 * 24);
        const days = Math.floor(totalDays);
        const remainingHours = (totalDays - days) * 24;
        const hours = Math.floor(remainingHours);
        const minutes = Math.floor((remainingHours - hours) * 60);

        return {
            days,
            hours,
            minutes,
            totalDays: parseFloat(totalDays.toFixed(2))
        };
    }

    /**
     * Get stats by project
     * Validates that employees can only see projects they're assigned to
     */
    async getProjectStats(projectId: string, userId?: string, userRole?: string) {
        // Get project to calculate total duration
        const project = await this.prisma.project.findUnique({
            where: { id: projectId },
            select: {
                createdAt: true,
                status: true,
                updatedAt: true,
                employees: {
                    select: {
                        employeeId: true,
                    },
                },
            }
        });

        if (!project) {
            throw new Error(`Project ${projectId} not found`);
        }

        // If user is an employee, verify they're assigned to this project
        if (userRole === 'EMPLOYEE' && userId) {
            const isAssigned = project.employees.some(pe => pe.employeeId === userId);
            if (!isAssigned) {
                throw new Error('You do not have access to this project');
            }
        }

        // Calculate total duration from project creation to now (or completion)
        const startDate = project.createdAt;
        const endDate = project.status === 'COMPLETED' ? project.updatedAt : new Date();
        const durationBreakdown = this.calculateDurationBreakdown(startDate, endDate);

        // Get all time tracking records for feedback cycle stats
        const trackings = await this.prisma.timeTracking.findMany({
            where: {
                projectId,
                endTime: { not: null } // Only completed cycles
            },
            select: {
                durationDays: true,
                approvedFileId: true,
                cycle: {
                    select: {
                        status: true,
                    }
                }
            }
        });

        // Calculate cycles and rejections
        // A rejection is when a feedback cycle has status 'rejected'
        const totalCycles = trackings.length;
        const totalRejections = trackings.filter(t => t.cycle?.status === 'rejected').length;
        const rejectionRate = totalCycles > 0 ? totalRejections / totalCycles : 0;

        // Calculate average cycle duration
        const averageCycleDuration = totalCycles > 0
            ? trackings.reduce((sum, t) => sum + (t.durationDays || 0), 0) / totalCycles
            : 0;

        return {
            totalDurationDays: durationBreakdown.totalDays,
            durationDays: durationBreakdown.days,
            durationHours: durationBreakdown.hours,
            durationMinutes: durationBreakdown.minutes,
            totalCycles,
            averageCycleDuration: parseFloat(averageCycleDuration.toFixed(1)),
            rejectionRate: parseFloat(rejectionRate.toFixed(2)),
            totalRejections,
        };
    }
}
