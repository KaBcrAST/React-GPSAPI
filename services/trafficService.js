const axios = require('axios');

class TrafficService {
  async getRouteTraffic(origin, destination, reports) {
    try {
      // Get route from Valhalla
      const routeData = await this.getRouteFromValhalla(origin, destination);
      
      // Enhance with our reports
      return this.enhanceWithReports(routeData, reports);
    } catch (error) {
      console.error('Traffic service error:', error);
      throw error;
    }
  }

  async getRouteFromValhalla(origin, destination) {
    const response = await axios.post('https://valhalla.openstreetmap.de/route', {
      locations: [
        { lat: origin.latitude, lon: origin.longitude },
        { lat: destination.latitude, lon: destination.longitude }
      ],
      costing: "auto",
      costing_options: {
        auto: {
          use_highways: 1,
          use_traffic: 1
        }
      },
      directions_options: {
        units: "kilometers",
        language: "fr-FR"
      }
    });

    return response.data;
  }

  enhanceWithReports(routeData, reports) {
    const path = routeData.trip.legs[0].shape;
    const segments = routeData.trip.legs[0].maneuvers;

    // Check for reports near the route segments
    const enhancedSegments = segments.map(segment => {
      const nearbyReports = reports.filter(report => 
        this.isReportNearSegment(report, segment, path)
      );

      return {
        ...segment,
        reports: nearbyReports,
        hasTrafficIssue: nearbyReports.some(r => r.type === 'TRAFFIC' && r.count >= 10)
      };
    });

    return {
      ...routeData,
      enhancedRoute: {
        segments: enhancedSegments,
        hasTrafficIssues: enhancedSegments.some(s => s.hasTrafficIssue),
        totalReports: enhancedSegments.reduce((acc, s) => acc + s.reports.length, 0)
      }
    };
  }

  isReportNearSegment(report, segment, path) {
    // Check if report is within 100m of the segment
    const reportCoords = report.location.coordinates;
    const segmentStart = path[segment.begin_shape_index];
    const segmentEnd = path[segment.end_shape_index];

    return this.getDistanceFromLine(
      reportCoords[1], reportCoords[0],
      segmentStart[0], segmentStart[1],
      segmentEnd[0], segmentEnd[1]
    ) < 0.1; // 100 meters
  }

  getDistanceFromLine(x, y, x1, y1, x2, y2) {
    const A = x - x1;
    const B = y - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const len_sq = C * C + D * D;
    let param = -1;

    if (len_sq !== 0) param = dot / len_sq;

    let xx, yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = x - xx;
    const dy = y - yy;

    return Math.sqrt(dx * dx + dy * dy);
  }
}

module.exports = new TrafficService();