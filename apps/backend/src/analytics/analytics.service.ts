import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, Invoice } from '@prisma/client';

interface ClientFinancials {
  totalBilled: number;
  totalPaid: number;
  outstanding: number;
  projectCount: number;
  onTimePaymentRate: number;
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getClientFinancials(clientId: string): Promise<ClientFinancials> {
    const invoices: Invoice[] = await this.prisma.invoice.findMany({
      where: { clientId },
    });

    const totalBilled = invoices.reduce(
      (sum: number, inv: Invoice) => sum + Number(inv.totalAmount),
      0,
    );
    const totalPaid = invoices.reduce(
      (sum: number, inv: Invoice) => sum + Number(inv.amountPaid),
      0,
    );
    const outstanding = totalBilled - totalPaid;
    const projectCount = await this.prisma.project.count({
      where: { clientId },
    });

    return {
      totalBilled,
      totalPaid,
      outstanding,
      projectCount,
      onTimePaymentRate: 100, // Placeholder calculation
    };
  }

  /**
   * Get detailed performance metrics for all employees
   */
  async getEmployeePerformance() {
    const employees = await this.prisma.user.findMany({
      where: { role: Role.EMPLOYEE, isActive: true },
      select: { id: true, firstName: true, lastName: true, email: true },
    });

    const performanceData = [];

    for (const emp of employees) {
      // Fetch completed work (TimeTracking with end time)
      const completedTracks = await this.prisma.timeTracking.findMany({
        where: {
          employeeId: emp.id,
          endTime: { not: null },
          paymentId: { not: null }, // Only count paid work for efficiency? Or all approved? V2 says "Total Paid" is factor.
        },
        include: {
          payment: true,
        },
      });

      const totalDeliveries = completedTracks.length;
      let totalPaid = 0;
      let totalDays = 0;
      let firstTryCount = 0;
      let totalRejections = 0;

      completedTracks.forEach((track) => {
        totalPaid += Number(track.payment?.amount || 0);
        totalDays += track.durationDays || 0;
        if (track.versionCount === 1) firstTryCount++;
        totalRejections += track.rejectionCount;
      });

      // Avoid division by zero
      const efficiencyPerDay = totalDays > 0 ? totalPaid / totalDays : 0;
      const firstTryRate =
        totalDeliveries > 0 ? (firstTryCount / totalDeliveries) * 100 : 0;
      const avgRejections =
        totalDeliveries > 0 ? totalRejections / totalDeliveries : 0;

      performanceData.push({
        employee: {
          id: emp.id,
          name: `${emp.firstName} ${emp.lastName}`,
        },
        metrics: {
          totalDeliveries,
          totalPaid,
          totalDays: Number.parseFloat(totalDays.toFixed(2)),
          efficiencyPerDay: Number.parseFloat(efficiencyPerDay.toFixed(2)),
          firstTryRate: Number.parseFloat(firstTryRate.toFixed(1)),
          avgRejections: Number.parseFloat(avgRejections.toFixed(1)),
        },
      });
    }

    return performanceData;
  }
}
