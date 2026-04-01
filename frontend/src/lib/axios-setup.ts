import { store } from '@/stores/index';
import { attachInterceptors } from './axios';
import { refreshThunk, logoutThunk } from '@/features/auth/stores/auth.slice';

attachInterceptors({
  getToken: () => {
    const tokenObj = store.getState().auth.accessToken;
    return tokenObj?.token ?? null; // return the actual string token
  },
  onRefresh: async () => {
    const result = await store.dispatch(refreshThunk()).unwrap();
    return result.accessToken.token; // return the string token for retry
  },
  onLogout: () => store.dispatch(logoutThunk()),
});