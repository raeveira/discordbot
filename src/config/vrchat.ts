import axios from 'axios';

export const vrchatAxios = axios.create({
  baseURL: 'https://api.vrchat.cloud/api/1',
  headers: {
    'User-Agent': 'discordbot/0.0.1 rae@raeveira.nl',
  },
  withCredentials: true, // for cookies
});
