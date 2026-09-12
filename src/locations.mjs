// Explicit approximate city centers. No network geocoding or inferred residence.
export const PLACES = [
 ['london','London',51.51,-.13,['london','伦敦']],['paris','Paris',48.86,2.35,['paris','巴黎']],['berlin','Berlin',52.52,13.4,['berlin','柏林']],['amsterdam','Amsterdam',52.37,4.9,['amsterdam','阿姆斯特丹']],['lisbon','Lisbon',38.72,-9.14,['lisbon','lisboa','里斯本']],['madrid','Madrid',40.42,-3.7,['madrid','马德里']],['rome','Rome',41.9,12.5,['rome','roma','罗马']],['zurich','Zurich',47.38,8.54,['zurich','zürich','苏黎世']],
 ['new-york','New York',40.71,-74.01,['new york','nyc','纽约']],['san-francisco','San Francisco',37.77,-122.42,['san francisco','sf','旧金山']],['los-angeles','Los Angeles',34.05,-118.24,['los angeles','洛杉矶']],['seattle','Seattle',47.61,-122.33,['seattle','西雅图']],['austin','Austin',30.27,-97.74,['austin','奥斯汀']],['toronto','Toronto',43.65,-79.38,['toronto','多伦多']],['vancouver','Vancouver',49.28,-123.12,['vancouver','温哥华']],['mexico-city','Mexico City',19.43,-99.13,['mexico city','ciudad de méxico','墨西哥城']],['sao-paulo','São Paulo',-23.55,-46.63,['sao paulo','são paulo','圣保罗']],['buenos-aires','Buenos Aires',-34.6,-58.38,['buenos aires','布宜诺斯艾利斯']],
 ['beijing','Beijing',39.9,116.4,['beijing','北京']],['shanghai','Shanghai',31.23,121.47,['shanghai','上海']],['shenzhen','Shenzhen',22.54,114.06,['shenzhen','深圳']],['guangzhou','Guangzhou',23.13,113.26,['guangzhou','广州']],['hangzhou','Hangzhou',30.27,120.15,['hangzhou','杭州']],['chengdu','Chengdu',30.57,104.07,['chengdu','成都']],['hong-kong','Hong Kong',22.32,114.17,['hong kong','香港']],['taipei','Taipei',25.03,121.57,['taipei','台北']],['tokyo','Tokyo',35.68,139.69,['tokyo','東京','东京']],['osaka','Osaka',34.69,135.5,['osaka','大阪']],['seoul','Seoul',37.57,126.98,['seoul','서울','首尔']],['singapore','Singapore',1.35,103.82,['singapore','新加坡']],['bangkok','Bangkok',13.76,100.5,['bangkok','曼谷']],['bengaluru','Bengaluru',12.97,77.59,['bengaluru','bangalore','班加罗尔']],['mumbai','Mumbai',19.08,72.88,['mumbai','孟买']],['delhi','Delhi',28.61,77.21,['new delhi','delhi','新德里']],['dubai','Dubai',25.2,55.27,['dubai','迪拜']],['sydney','Sydney',-33.87,151.21,['sydney','悉尼']],['melbourne','Melbourne',-37.81,144.96,['melbourne','墨尔本']],['auckland','Auckland',-36.85,174.76,['auckland','奥克兰']],['lagos','Lagos',6.52,3.38,['lagos','拉各斯']],['nairobi','Nairobi',-1.29,36.82,['nairobi','内罗毕']],['cape-town','Cape Town',-33.93,18.42,['cape town','开普敦']],['cairo','Cairo',30.04,31.24,['cairo','القاهرة','开罗']]
].map(([id,label,lat,lon,aliases])=>({id,label,lat,lon,aliases}));
export function matchLocation(raw) {
  if(typeof raw!=='string'||!raw.trim())return null;
  const words=raw.toLowerCase().trim();
  const matches=PLACES.filter(p=>p.aliases.some(alias=>{if(/[^a-z\s-]/.test(alias))return words.includes(alias);return new RegExp(`(^|[^a-z])${alias}([^a-z]|$)`,'i').test(words);}));
  if(matches.length!==1)return null;
  const {label,lat,lon}=matches[0];return {label,lat,lon,source:'github'};
}
export function validLocation(value) {
  return value&&typeof value.label==='string'&&value.label.trim().length>0&&value.label.length<=160&&Number.isFinite(value.lat)&&value.lat>=-90&&value.lat<=90&&Number.isFinite(value.lon)&&value.lon>=-180&&value.lon<=180&&['github','manual'].includes(value.source);
}
export function residentGroups(event) {
  if(event.collectionType==='personal'||!event.residentMap?.enabled)return [];
  const groups=new Map();
  for(const p of event.projects){const loc=p.builder.location;if(!validLocation(loc))continue;const key=`${loc.lat.toFixed(1)},${loc.lon.toFixed(1)}`;
    if(!groups.has(key))groups.set(key,{key,label:loc.label,lat:loc.lat,lon:loc.lon,projects:[],residents:new Set()});
    const g=groups.get(key);g.projects.push(p);g.residents.add((p.builder.url||p.builder.name).replace(/\/$/,'').toLowerCase());
  }
  return [...groups.values()].map(g=>({...g,residents:g.residents.size}));
}
