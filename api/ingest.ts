import { APIGatewayEvent, Context } from 'aws-lambda';
// @ts-ignore
import * as multipart from 'aws-lambda-multipart-parser';
import { ingestPdfFiles } from '@/scripts/ingest-data';

class IngestDataHandler {
  public static async pdfFile(
    event: APIGatewayEvent,
    _context: Context,
  ): Promise<{ statusCode: number; body: string }> {
    const { userId } = event.pathParameters!;
    // const pdfFile = event.body!;
    const pdfFile = new Buffer(event.body!, 'base64');

    try {
      await ingestPdfFiles(userId!, pdfFile);
    } catch (error) {
      return {
        statusCode: 500,
        body: JSON.stringify(
          {
            message: `Failed to load PDF to user ${userId}!`,
          },
          null,
          2,
        ),
      };
    }
    return {
      statusCode: 200,
      body: JSON.stringify(
        {
          message: `Ingested PDF successfully to user ${userId}!`,
        },
        null,
        2,
      ),
    };
  }
}

export const { pdfFile } = IngestDataHandler;
