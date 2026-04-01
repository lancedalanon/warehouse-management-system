import { promises as fs } from 'fs';
import Handlebars from 'handlebars';
import htmlToPdfmake from 'html-to-pdfmake';
import { PassThrough } from 'stream';
import { PdfRenderer } from '../PdfRenderer';
import path from 'path';

// Mock dependencies
jest.mock('fs', () => ({ promises: { readFile: jest.fn() } }));
jest.mock('handlebars');
jest.mock('html-to-pdfmake');

const mockCreatePdfKitDocument = jest.fn();
jest.mock('pdfmake/src/printer', () =>
  jest.fn().mockImplementation(() => ({
    createPdfKitDocument: mockCreatePdfKitDocument,
  })),
);

jest.mock('jsdom', () => ({
  JSDOM: jest.fn().mockImplementation(() => ({
    window: { document: { body: { innerHTML: '<h1>Hello</h1>' } } },
  })),
}));

describe('PdfRenderer', () => {
  const mockedReadFile = fs.readFile as jest.Mock;
  const mockedCompile = Handlebars.compile as jest.Mock;
  const mockedHtmlToPdfMake = htmlToPdfmake as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render a PDF buffer from template', async () => {
    mockedReadFile.mockResolvedValue('<h1>{{title}}</h1>');

    const compiledFn = jest.fn().mockReturnValue('<h1>Hello</h1>');
    mockedCompile.mockReturnValue(compiledFn);
    mockedHtmlToPdfMake.mockReturnValue([{ text: 'Hello' }]);

    // Fully typed mock for PDF stream
    let pipedStream: PassThrough;
    mockCreatePdfKitDocument.mockImplementation(() => ({
      pipe: (stream: PassThrough) => {
        pipedStream = stream;
        return stream;
      },
      end: () => {
        process.nextTick(() => {
          pipedStream.write(Buffer.from('pdf-data'));
          pipedStream.end();
        });
      },
    }));

    const renderer = new PdfRenderer();
    const buffer = await renderer.render({
      template: 'test-template.hbs',
      data: { title: 'Hello' },
    });

    expect(fs.readFile).toHaveBeenCalled();
    expect(Handlebars.compile).toHaveBeenCalledWith('<h1>{{title}}</h1>');
    expect(compiledFn).toHaveBeenCalledWith({ title: 'Hello' });
    expect(mockedHtmlToPdfMake).toHaveBeenCalled();

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('should render using a relative template path', async () => {
    mockedReadFile.mockResolvedValue('<h1>{{title}}</h1>');
    mockedCompile.mockReturnValue(jest.fn().mockReturnValue('<h1>Hello</h1>'));

    const renderer = new PdfRenderer();
    await renderer.render({ template: 'test.hbs', data: {} });

    // Verifies path.join was used because 'test.hbs' is not absolute
    expect(mockedReadFile).toHaveBeenCalledWith(
      expect.stringContaining(path.join('templates', 'test.hbs')),
      'utf8',
    );
  });

  it('should render using an absolute template path', async () => {
    mockedReadFile.mockResolvedValue('<h1>{{title}}</h1>');
    mockedCompile.mockReturnValue(jest.fn().mockReturnValue('<h1>Hello</h1>'));

    const absolutePath = path.resolve('/absolute/path/to/template.hbs');
    const renderer = new PdfRenderer();
    await renderer.render({ template: absolutePath, data: {} });

    // Verifies the absolute path was used directly
    expect(mockedReadFile).toHaveBeenCalledWith(absolutePath, 'utf8');
  });
});
