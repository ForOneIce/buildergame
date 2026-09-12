import { createServer } from 'node:http';
import { createWebHandler } from './http.mjs';

createServer(createWebHandler()).listen(Number(process.env.PORT || 3000), '0.0.0.0', () => console.log(`Buildergame server listening on port ${process.env.PORT || 3000}`));
