import { BrevoEmailProvider } from '@/lib/email/api/BrevoEmailProvider';
import axios from 'axios';

jest.mock('axios');

describe('BrevoEmailProvider', () => {
  const mockedAxios = axios as jest.Mocked<typeof axios>;

  beforeEach(() => {
    jest.clearAllMocks();

    process.env.APP_NAME = 'TestApp';
    process.env.MAIL_USER = 'noreply@test.com';
    process.env.MAIL_API_KEY = 'test-api-key';
  });

  it('should send email using Brevo API', async () => {
    mockedAxios.post.mockResolvedValue({} as never);

    const provider = new BrevoEmailProvider();

    const params = {
      to: 'user@test.com',
      subject: 'Test Subject',
      text: 'Plain text body',
      html: '<p>HTML body</p>',
    };

    await provider.send(params);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: {
          name: 'TestApp',
          email: 'noreply@test.com',
        },
        to: [
          {
            email: 'user@test.com',
          },
        ],
        subject: 'Test Subject',
        textContent: 'Plain text body',
        htmlContent: '<p>HTML body</p>',
      },
      {
        headers: {
          'api-key': 'test-api-key',
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      },
    );
  });
});
