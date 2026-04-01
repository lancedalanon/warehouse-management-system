import { createSlice } from '@reduxjs/toolkit';
import type { UsersState } from './user.types';
import {
  getUsersThunk,
  getUserThunk,
  createUserThunk,
  updateUserThunk,
  deleteUserThunk,
} from './user.thunks';

const initialState: UsersState = {
  items: [],
  meta: null,
  status: {
    fetch: 'idle',
    create: 'idle',
    update: 'idle',
    delete: 'idle',
  },
  error: {},
  singleUser: undefined,
};

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearUsersState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      /* GET USERS */
      .addCase(getUsersThunk.pending, (state) => {
        state.status.fetch = 'loading';
        state.error.fetch = undefined;
      })
      .addCase(getUsersThunk.fulfilled, (state, action) => {
        state.status.fetch = 'success';
        state.items = action.payload.data;
        state.meta = action.payload.meta;
      })
      .addCase(getUsersThunk.rejected, (state, action) => {
        state.status.fetch = 'error';
        state.error.fetch = action.payload;
      })

      /* GET USER (single) */
      .addCase(getUserThunk.fulfilled, (state, action) => {
        state.singleUser = action.payload;
        const index = state.items.findIndex((i) => i.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })

      /* CREATE */
      .addCase(createUserThunk.pending, (state) => {
        state.status.create = 'loading';
        state.error.create = undefined;
      })
      .addCase(createUserThunk.fulfilled, (state, action) => {
        state.status.create = 'success';
        if (state.meta?.page === 1) {
          state.items.unshift(action.payload);
          state.items = state.items.slice(0, state.meta.limit);
        }
      })
      .addCase(createUserThunk.rejected, (state, action) => {
        state.status.create = 'error';
        state.error.create = action.payload;
      })

      /* UPDATE */
      .addCase(updateUserThunk.pending, (state) => {
        state.status.update = 'loading';
        state.error.update = undefined;
      })
      .addCase(updateUserThunk.fulfilled, (state, action) => {
        state.status.update = 'success';
        const index = state.items.findIndex((i) => i.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(updateUserThunk.rejected, (state, action) => {
        state.status.update = 'error';
        state.error.update = action.payload;
      })

      /* DELETE */
      .addCase(deleteUserThunk.pending, (state) => {
        state.status.delete = 'loading';
        state.error.delete = undefined;
      })
      .addCase(deleteUserThunk.fulfilled, (state, action) => {
        state.status.delete = 'success';
        state.items = state.items.filter((i) => i.id !== action.payload);
      })
      .addCase(deleteUserThunk.rejected, (state, action) => {
        state.status.delete = 'error';
        state.error.delete = action.payload;
      });
  },
});

export const { clearUsersState } = usersSlice.actions;
export { getUsersThunk, getUserThunk, createUserThunk, updateUserThunk, deleteUserThunk };
export default usersSlice.reducer;
