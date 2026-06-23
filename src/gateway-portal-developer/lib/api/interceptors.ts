export const authHeader = (token?: string) => ({
  Authorization: token ? `Bearer ${token}` : "",
});
