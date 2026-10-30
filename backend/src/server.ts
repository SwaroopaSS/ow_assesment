import 'dotenv/config';
import { loadConfig } from './config';
import { buildApp } from './compose';

const config = loadConfig();
buildApp(config).listen(config.PORT, () => {
  console.log(`Catalogue API listening on :${config.PORT}`);
});
