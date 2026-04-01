import { createSlice } from '@reduxjs/toolkit';
import type { AuthState } from './auth.types';
import {
  forgotPasswordThunk,
  loginThunk,
  logoutThunk,
  refreshThunk,
  changePasswordThunk,
  requestInvitationThunk,
  updateAccountInfoThunk,
  changeEmailThunk,
  updatePasswordThunk,
  requestEmailVerificationThunk,
  verifyEmailThunk,
} from './auth.thunks';

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshing: false,
  authStatus: 'idle',
  loginStatus: 'idle',
  forgotPasswordStatus: 'idle',
  resetPasswordStatus: 'idle',
  requestInvitationStatus: 'idle',
  updateAccountInfoStatus: 'idle',
  changeEmailStatus: 'idle',
  updatePasswordStatus: 'idle',
  requestEmailVerificationStatus: 'idle',
  verifyEmailStatus: 'idle',
  verifyEmailMessage: null,
  error: null,
  updateAccountInfoError: null,
  changeEmailError: null,
  updatePasswordError: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      /* LOGIN */
      .addCase(loginThunk.pending, (state) => {
        state.loginStatus = 'loading';
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.loginStatus = 'idle';
        state.authStatus = 'authenticated';
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loginStatus = 'error';
        state.error = action.payload as string;
      })

      /* REFRESH */
      .addCase(refreshThunk.pending, (state) => {
        // Only set loading if no user yet (initial load)
        if (!state.user) {
          state.authStatus = 'loading';
        } else {
          state.refreshing = true;
        }
      })
      .addCase(refreshThunk.fulfilled, (state, action) => {
        state.authStatus = 'authenticated';
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
      })
      .addCase(refreshThunk.rejected, (state) => {
        state.authStatus = 'error';
        state.user = null;
        state.accessToken = null;
      })

      /* LOGOUT */
      .addCase(logoutThunk.fulfilled, () => initialState)
      .addCase(logoutThunk.rejected, (state, action) => {
        state.authStatus = 'error';
        state.error = action.payload as string;
      })

      /* FORGOT PASSWORD */
      .addCase(forgotPasswordThunk.pending, (state) => {
        state.forgotPasswordStatus = 'loading';
        state.error = null;
      })
      .addCase(forgotPasswordThunk.fulfilled, (state) => {
        state.forgotPasswordStatus = 'success';
      })
      .addCase(forgotPasswordThunk.rejected, (state, action) => {
        state.forgotPasswordStatus = 'error';
        state.error = action.payload as string;
      })

      /* RESET PASSWORD */
      .addCase(changePasswordThunk.pending, (state) => {
        state.resetPasswordStatus = 'loading';
        state.error = null;
      })
      .addCase(changePasswordThunk.fulfilled, (state) => {
        state.resetPasswordStatus = 'success';
      })
      .addCase(changePasswordThunk.rejected, (state, action) => {
        state.resetPasswordStatus = 'error';
        state.error = action.payload as string;
      })

      /* REQUEST INVITATION */
      .addCase(requestInvitationThunk.pending, (state) => {
        state.requestInvitationStatus = 'loading';
        state.error = null;
      })
      .addCase(requestInvitationThunk.fulfilled, (state) => {
        state.requestInvitationStatus = 'success';
      })
      .addCase(requestInvitationThunk.rejected, (state, action) => {
        state.requestInvitationStatus = 'error';
        state.error = action.payload as string;
      })

      /* UPDATE ACCOUNT INFO */
      .addCase(updateAccountInfoThunk.pending, (state) => {
        state.updateAccountInfoStatus = 'loading';
        state.error = null;
      })
      .addCase(updateAccountInfoThunk.fulfilled, (state, action) => {
        state.updateAccountInfoStatus = 'success';
        state.user = action.payload;
      })
      .addCase(updateAccountInfoThunk.rejected, (state, action) => {
        state.updateAccountInfoStatus = 'error';
        state.updateAccountInfoError = action.payload;
      })

      /* CHANGE EMAIL */
      .addCase(changeEmailThunk.pending, (state) => {
        state.changeEmailStatus = 'loading';
        state.error = null;
      })
      .addCase(changeEmailThunk.fulfilled, (state, action) => {
        state.changeEmailStatus = 'success';
        state.user = action.payload;
      })
      .addCase(changeEmailThunk.rejected, (state, action) => {
        state.changeEmailStatus = 'error';
        state.changeEmailError = action.payload;
      })

      .addCase(updatePasswordThunk.pending, (state) => {
        state.updatePasswordStatus = 'loading';
        state.error = null;
      })
      .addCase(updatePasswordThunk.fulfilled, (state, action) => {
        state.updatePasswordStatus = 'success';
        state.user = action.payload;
      })
      .addCase(updatePasswordThunk.rejected, (state, action) => {
        state.updatePasswordStatus = 'error';
        state.updatePasswordError = action.payload;
      })

      /* Request Email Verification */
      .addCase(requestEmailVerificationThunk.pending, (state) => {
        state.requestEmailVerificationStatus = 'loading';
        state.error = null;
      })
      .addCase(requestEmailVerificationThunk.fulfilled, (state) => {
        state.requestEmailVerificationStatus = 'success';
      })
      .addCase(requestEmailVerificationThunk.rejected, (state, action) => {
        state.requestEmailVerificationStatus = 'error';
        state.error = action.payload as string;
      })

      /* Verify Email */
      .addCase(verifyEmailThunk.pending, (state) => {
        state.verifyEmailStatus = 'loading';
        state.verifyEmailMessage = null;
        state.error = null;
      })
      .addCase(verifyEmailThunk.fulfilled, (state, action) => {
        state.verifyEmailStatus = 'success';
        state.verifyEmailMessage = action.payload;
        if (state.user) {
          state.user.emailVerifiedAt = new Date().toISOString();
        }
      })
      .addCase(verifyEmailThunk.rejected, (state, action) => {
        state.verifyEmailStatus = 'error';
        state.verifyEmailMessage = null;
        state.error = action.payload as string;
      });
  },
});

export { loginThunk, logoutThunk, refreshThunk, forgotPasswordThunk, changePasswordThunk };
export const { clearAuthState } = authSlice.actions;
export default authSlice.reducer;
