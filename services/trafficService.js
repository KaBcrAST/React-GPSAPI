const axios = require('axios');

class TrafficService {
  constructor() {
    this.baseUrl = 'https://valhalla.openstreetmap.de';
  }

  async getRouteTraffic(origin, destination, reports = []) {
    try {
      console.log('Getting route traffic for:', { origin, destination });
      
      // Récupérer l'itinéraire de base
      const routeData = await this.getRouteData(origin, destination);
      
      if (!routeData || !routeData.trip) {
        console.error('No route data received from Valhalla');
        return null;
      }

      // Enrichir avec les reports de trafic
      return {
        summary: {
          distance: routeData.trip.summary.length,
          duration: routeData.trip.summary.time,
          hasTrafficIssues: reports.length > 0
        },
        segments: this.enrichSegmentsWithReports(routeData.trip.legs[0], reports)
      };
    } catch (error) {
      console.error('TrafficService error:', error);
      throw new Error(`Traffic service error: ${error.message}`);
    }
  }

  async getRouteData(origin, destination) {
    try {
      const response = await axios.post(`${this.baseUrl}/route`, {
        locations: [
          { lat: origin.latitude, lon: origin.longitude },
          { lat: destination.latitude, lon: destination.longitude }
        ],
        costing: "auto",
        directions_options: {
          units: "kilometers",
          language: "fr-FR"
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Failed to get route data:', error);
      throw new Error('Failed to get route data from Valhalla');
    }
  }

  enrichSegmentsWithReports(leg, reports) {
    if (!leg || !leg.maneuvers) return [];

    return leg.maneuvers.map(maneuver => {
      const nearbyReports = this.findNearbyReports(
        maneuver.begin_shape_index,
        reports
      );

      return {
        instruction: maneuver.instruction,
        distance: maneuver.length,
        duration: maneuver.time,
        reports: nearbyReports,
        hasTrafficIssue: nearbyReports.length > 0
      };
    });
  }

  findNearbyReports(location, reports) {
    // Simplifier pour le débogage
    return reports.filter(report => 
      report.type === 'TRAFFIC' && 
      report.distance < 1000 // Reports within 1km
    );
  }
}

module.exports = new TrafficService();