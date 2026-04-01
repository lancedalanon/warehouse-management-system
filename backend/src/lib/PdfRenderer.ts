import { promises as fs } from 'fs';
import path from 'path';
import Handlebars from 'handlebars';
import { JSDOM } from 'jsdom';
import htmlToPdfmake from 'html-to-pdfmake';
import { finished } from 'stream/promises';
import { PassThrough } from 'stream';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PdfPrinter = require('pdfmake/src/printer');

export interface PdfOptions {
  template: string;
  data: unknown;
}

type Fonts = {
  [font: string]: {
    normal: string;
    bold?: string;
    italics?: string;
    bolditalics?: string;
  };
};

export class PdfRenderer {
  private readonly templatesBase = path.join(__dirname, '../templates');

  private readonly fonts: Fonts = {
    Roboto: {
      normal:
        require.resolve('roboto-font/fonts/Roboto/roboto-regular-webfont.ttf'),
      bold: require.resolve('roboto-font/fonts/Roboto/roboto-bold-webfont.ttf'),
      italics:
        require.resolve('roboto-font/fonts/Roboto/roboto-italic-webfont.ttf'),
      bolditalics:
        require.resolve('roboto-font/fonts/Roboto/roboto-bolditalic-webfont.ttf'),
    },
  };

  public async render(options: PdfOptions): Promise<Buffer> {
    const templatePath = path.isAbsolute(options.template)
      ? options.template
      : path.join(this.templatesBase, options.template);

    const templateContent = await fs.readFile(templatePath, 'utf8');
    const html = Handlebars.compile(templateContent)(options.data);

    const dom = new JSDOM(`<!doctype html><html><body>${html}</body></html>`);
    const window = dom.window;

    const pdfmakeContent = htmlToPdfmake(window.document.body.innerHTML, {
      window,
    });

    const docDefinition = {
      content: pdfmakeContent,
      pageSize: 'A4',
      pageMargins: [40, 40, 40, 60],
      defaultStyle: {
        font: 'Roboto',
        fontSize: 11,
      },
    };

    const printer = new PdfPrinter(this.fonts);
    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    const stream = new PassThrough();
    const chunks: Buffer[] = [];

    pdfDoc.pipe(stream);
    stream.on('data', (c: Buffer) => chunks.push(c));
    pdfDoc.end();

    await finished(stream);

    return Buffer.concat(chunks);
  }
}
