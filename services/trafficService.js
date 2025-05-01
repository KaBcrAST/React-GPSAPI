const axios = require('axios');

class TrafficService {
  async getRouteTraffic(origin, destination, reports = []) {
    try {
      const path = this.calculateDirectPath(origin, destination);
      
      const segments = this.createSegments(path, reports);

      return {
        summary: {
          distance: this.calculateDistance(origin, destination),
          duration: this.estimateDuration(origin, destination),
          hasTrafficIssues: reports.length > 0
        },
        segments: segments,
        trafficClusters: this.groupReportsByClusters(reports)
      };
    } catch (error) {
      console.error('Traffic service error :', error);
      return null;
    }
  }

  calculateDirectPath(origin, destination) {
    const steps = 10;
    const path = [];
    
    for (let i = 0; i <= steps; i++) {
      path.push({
        latitude: origin.latitude + (destination.latitude - origin.latitude) * (i / steps),
        longitude: origin.longitude + (destination.longitude - origin.longitude) * (i / steps)
      });
    }
    
    return path;
  }

  createSegments(path, reports) {
    return path.slice(0, -1).map((start, index) => {
      const end = path[index + 1];
      const nearbyReports = reports.filter(report => 
        this.isReportNearSegment(report, start, end)
      );

      return {
        start,
        end,
        distance: this.calculateDistance(start, end),
        reports: nearbyReports,
        hasTrafficIssue: nearbyReports.length >= 10
      };
    });
  }

  calculateDistance(point1, point2) {
    const R = 6371e3;
    const φ1 = point1.latitude * Math.PI/180;
    const φ2 = point2.latitude * Math.PI/180;
    const Δφ = (point2.latitude - point1.latitude) * Math.PI/180;
    const Δλ = (point2.longitude - point1.longitude) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  estimateDuration(origin, destination) {
    const distance = this.calculateDistance(origin, destination);
    const averageSpeed = 30;
    return Math.round((distance / 1000) / averageSpeed * 3600);
  }

  isReportNearSegment(report, start, end) {
    const distance = this.calculateDistance(
      { latitude: report.location.coordinates[1], longitude: report.location.coordinates[0] },
      start
    );
    return distance < 1000;
  }

  groupReportsByClusters(reports) {
    const clusters = [];
    
    for (const report of reports) {
      let added = false;
      for (const cluster of clusters) {
        if (this.calculateDistance(
          { latitude: report.location.coordinates[1], longitude: report.location.coordinates[0] },
          { latitude: cluster.center[1], longitude: cluster.center[0] }
        ) < 100) {
          cluster.reports.push(report);
          added = true;
          break;
        }
      }
      
      if (!added) {
        clusters.push({
          center: report.location.coordinates,
          reports: [report]
        });
      }
    }

    return clusters;
  }
}

module.exports = new TrafficService();