import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 10, checkperiod: 20 }); // 10 seconds default

export default cache;