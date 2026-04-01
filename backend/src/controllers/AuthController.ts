import { Request, Response } from 'express';
import { ResponseHandler } from '@/lib/ResponseHandler';
import { BaseController } from './BaseController';
import { LoginService } from '@/services/auth/LoginService';
import { RefreshTokenService } from '@/services/auth/RefreshTokenService';
import { LogoutService } from '@/services/auth/LogoutService';
import { inject, injectable } from 'tsyringe';
import { RequestInvitationService } from '@/services/auth/RequestInvitationService';
import { ForgotPasswordService } from '@/services/auth/ForgotPasswordService';
import { ChangePasswordService } from '@/services/auth/ChangePasswordService';
import { MeService } from '@/services/auth/MeService';
import { UpdateAccountInfoService } from '@/services/auth/UpdateAccountInfoService';
import { ChangeEmailService } from '@/services/auth/ChangeEmailService';
import { UpdatePasswordService } from '@/services/auth/UpdatePasswordService';
import { RequestEmailVerificationService } from '@/services/auth/RequestEmailVerificationService';
import { VerifyEmailService } from '@/services/auth/VerifyEmailService';

@injectable()
export class AuthController extends BaseController {
  constructor(
    @inject(LoginService) private readonly loginService: LoginService,
    @inject(RefreshTokenService)
    private readonly refreshTokenService: RefreshTokenService,
    @inject(LogoutService) private readonly logoutService: LogoutService,
    @inject(RequestInvitationService)
    private readonly requestInvitationService: RequestInvitationService,
    @inject(ForgotPasswordService)
    private readonly forgotPasswordService: ForgotPasswordService,
    @inject(ChangePasswordService)
    private readonly changePasswordService: ChangePasswordService,
    @inject(MeService)
    private readonly meService: MeService,
    @inject(UpdateAccountInfoService)
    private readonly updateAccountInfoService: UpdateAccountInfoService,
    @inject(ChangeEmailService)
    private readonly changeEmailService: ChangeEmailService,
    @inject(UpdatePasswordService)
    private readonly updatePasswordService: UpdatePasswordService,
    @inject(RequestEmailVerificationService)
    private readonly requestEmailVerificationService: RequestEmailVerificationService,
    @inject(VerifyEmailService)
    private readonly verifyEmailService: VerifyEmailService,
  ) {
    super();
    this.login = this.login.bind(this);
    this.refreshAccessToken = this.refreshAccessToken.bind(this);
    this.logout = this.logout.bind(this);
    this.requestInvitation = this.requestInvitation.bind(this);
    this.forgotPassword = this.forgotPassword.bind(this);
    this.changePassword = this.changePassword.bind(this);
    this.me = this.me.bind(this);
    this.updateAccountInfo = this.updateAccountInfo.bind(this);
    this.changeEmail = this.changeEmail.bind(this);
    this.updatePassword = this.updatePassword.bind(this);
    this.requestEmailVerification = this.requestEmailVerification.bind(this);
    this.verifyEmail = this.verifyEmail.bind(this);
  }

  async login(req: Request, res: Response) {
    const result = await this.loginService.handle(req.body);

    res.cookie('refreshToken', result.refreshToken.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: result.refreshToken.expiredAt.getTime() - Date.now(),
    });

    const data = {
      user: result.user,
      accessToken: result.accessToken,
    };

    ResponseHandler.success(res, 'Login successful', data);
  }

  async refreshAccessToken(req: Request, res: Response) {
    const refreshToken = req.cookies.refreshToken;

    const result = await this.refreshTokenService.handle(refreshToken);

    const data = {
      user: result.user,
      accessToken: result.accessToken,
    };

    ResponseHandler.success(res, 'Access token refreshed', data);
  }

  async logout(req: Request, res: Response) {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      await this.logoutService.handle(refreshToken);
    }

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    ResponseHandler.success(res, 'Logout successfully');
  }

  async requestInvitation(req: Request, res: Response) {
    const result = await this.requestInvitationService.handle(req.body);

    ResponseHandler.success(
      res,
      'Invitation requested, please check your email for further updates!',
      result,
      null,
      201,
    );
  }

  async forgotPassword(req: Request, res: Response) {
    const result = await this.forgotPasswordService.handle(req.body);

    ResponseHandler.success(
      res,
      'Password reset requested, please check your email!',
      result,
      null,
      201,
    );
  }

  async changePassword(req: Request, res: Response) {
    await this.changePasswordService.handle(req);
    ResponseHandler.success(res, 'Password changed successfully');
  }

  async me(req: Request, res: Response) {
    const result = await this.meService.handle(req);
    ResponseHandler.success(res, 'User fetched successfully', result);
  }

  async updateAccountInfo(req: Request, res: Response) {
    const result = await this.updateAccountInfoService.handle(req, req.body);
    ResponseHandler.success(res, 'Account updated successfully', result);
  }

  async changeEmail(req: Request, res: Response) {
    const result = await this.changeEmailService.handle(req, req.body);
    ResponseHandler.success(res, 'Email updated successfully', result);
  }

  async requestEmailVerification(req: Request, res: Response) {
    const result = await this.requestEmailVerificationService.handle(req.body);
    ResponseHandler.success(
      res,
      'Verification email sent successfully',
      result,
    );
  }

  async verifyEmail(req: Request, res: Response) {
    const token = req.query.token as string;
    const result = await this.verifyEmailService.handle(token);
    ResponseHandler.success(res, 'Email verified successfully', result);
  }

  async updatePassword(req: Request, res: Response) {
    const result = await this.updatePasswordService.handle(req, req.body);
    ResponseHandler.success(res, 'Password updated successfully', result);
  }
}
