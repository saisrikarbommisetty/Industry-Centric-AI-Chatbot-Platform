import { Request, Response, NextFunction } from 'express';
import { brochureService, BrochurePropertyData } from '../services/brochure/brochure.service';

export class BrochureController {
  /**
   * Generate & download genuine PDF brochure (POST)
   */
  async generateBrochure(req: Request, res: Response, next: NextFunction) {
    try {
      const data: BrochurePropertyData = req.body || {};
      const { buffer, filename } = await brochureService.generateBrochurePdf(data);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', buffer.length.toString());

      res.status(200).send(buffer);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Download genuine PDF brochure (GET)
   */
  async downloadBrochure(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        title,
        location,
        bhk,
        price,
        carpetArea,
        status,
        amenities,
        image,
        url,
      } = req.query;

      let amenitiesArray: string[] | undefined;
      if (typeof amenities === 'string') {
        amenitiesArray = amenities.split(',').map((a) => a.trim()).filter(Boolean);
      }

      const data: BrochurePropertyData = {
        title: title as string,
        location: location as string,
        bhk: bhk as string,
        priceRange: price as string,
        carpetArea: carpetArea as string,
        status: status as string,
        amenities: amenitiesArray,
        image: image as string,
        propertyDetailUrl: url as string,
      };

      const { buffer, filename } = await brochureService.generateBrochurePdf(data);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', buffer.length.toString());

      res.status(200).send(buffer);
    } catch (error) {
      next(error);
    }
  }
}

export const brochureController = new BrochureController();
