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
     * Get stats by project
     */
    async getProjectStats(projectId: string) {
        const trackings = await this.prisma.timeTracking.findMany({
            where: { projectId },
            include: {
                employee: {
                    select: { firstName: true, lastName: true, email: true }
                },
                cycle: true
            }
        });

        return trackings;
    }
}
