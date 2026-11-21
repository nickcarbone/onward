/* Destination names for multilingual airport boards.
 * IATA: [English, Japanese, Chinese (Hong Kong usage, Traditional), Korean]
 * Unlisted airports fall back to the English name the flight-data provider returns.
 */
window.ONWARD_CITY_I18N = {
  // Japan (Haneda's domestic network)
  HND: ['Tokyo-Haneda', '東京(羽田)', '東京(羽田)', '도쿄(하네다)'], NRT: ['Tokyo-Narita', '東京(成田)', '東京(成田)', '도쿄(나리타)'],
  CTS: ['Sapporo', '札幌(新千歳)', '札幌', '삿포로'], FUK: ['Fukuoka', '福岡', '福岡', '후쿠오카'], OKA: ['Okinawa', '沖縄(那覇)', '沖繩', '오키나와'],
  ITM: ['Osaka-Itami', '大阪(伊丹)', '大阪(伊丹)', '오사카(이타미)'], KIX: ['Osaka-Kansai', '大阪(関西)', '大阪(關西)', '오사카(간사이)'], UKB: ['Kobe', '神戸', '神戶', '고베'],
  NGO: ['Nagoya', '名古屋(中部)', '名古屋', '나고야'], KOJ: ['Kagoshima', '鹿児島', '鹿兒島', '가고시마'], KMJ: ['Kumamoto', '熊本', '熊本', '구마모토'],
  HIJ: ['Hiroshima', '広島', '廣島', '히로시마'], SDJ: ['Sendai', '仙台', '仙台', '센다이'], OKJ: ['Okayama', '岡山', '岡山', '오카야마'],
  KMI: ['Miyazaki', '宮崎', '宮崎', '미야자키'], NGS: ['Nagasaki', '長崎', '長崎', '나가사키'], OIT: ['Oita', '大分', '大分', '오이타'],
  MYJ: ['Matsuyama', '松山', '松山', '마쓰야마'], TAK: ['Takamatsu', '高松', '高松', '다카마쓰'], KCZ: ['Kochi', '高知', '高知', '고치'],
  HKD: ['Hakodate', '函館', '函館', '하코다테'], AKJ: ['Asahikawa', '旭川', '旭川', '아사히카와'], KMQ: ['Komatsu', '小松', '小松', '고마쓰'],
  ISG: ['Ishigaki', '石垣', '石垣', '이시가키'], MMY: ['Miyako', '宮古', '宮古', '미야코'], AOJ: ['Aomori', '青森', '青森', '아오모리'],
  UBJ: ['Yamaguchi Ube', '山口宇部', '山口宇部', '야마구치우베'], TOY: ['Toyama', '富山', '富山', '도야마'], IZO: ['Izumo', '出雲', '出雲', '이즈모'],
  TKS: ['Tokushima', '徳島', '德島', '도쿠시마'], KKJ: ['Kitakyushu', '北九州', '北九州', '기타큐슈'], AXT: ['Akita', '秋田', '秋田', '아키타'],
  GAJ: ['Yamagata', '山形', '山形', '야마가타'], KUH: ['Kushiro', '釧路', '釧路', '구시로'], OBO: ['Obihiro', '帯広', '帶廣', '오비히로'],
  MMB: ['Memanbetsu', '女満別', '女滿別', '메만베쓰'], HSG: ['Saga', '佐賀', '佐賀', '사가'], TTJ: ['Tottori', '鳥取', '鳥取', '돗토리'],
  // Korea, China, Taiwan
  ICN: ['Seoul-Incheon', 'ソウル(仁川)', '首爾(仁川)', '서울(인천)'], GMP: ['Seoul-Gimpo', 'ソウル(金浦)', '首爾(金浦)', '서울(김포)'],
  PUS: ['Busan', '釜山', '釜山', '부산'], CJU: ['Jeju', '済州', '濟州', '제주'],
  PEK: ['Beijing', '北京(首都)', '北京(首都)', '베이징'], PKX: ['Beijing-Daxing', '北京(大興)', '北京(大興)', '베이징(다싱)'],
  PVG: ['Shanghai-Pudong', '上海(浦東)', '上海(浦東)', '상하이(푸둥)'], SHA: ['Shanghai-Hongqiao', '上海(虹橋)', '上海(虹橋)', '상하이(훙차오)'],
  CAN: ['Guangzhou', '広州', '廣州', '광저우'], SZX: ['Shenzhen', '深圳', '深圳', '선전'], CTU: ['Chengdu', '成都', '成都', '청두'], TFU: ['Chengdu-Tianfu', '成都(天府)', '成都(天府)', '청두(톈푸)'],
  XMN: ['Xiamen', '厦門', '廈門', '샤먼'], DLC: ['Dalian', '大連', '大連', '다롄'], HGH: ['Hangzhou', '杭州', '杭州', '항저우'], NKG: ['Nanjing', '南京', '南京', '난징'],
  CKG: ['Chongqing', '重慶', '重慶', '충칭'], XIY: ["Xi'an", '西安', '西安', '시안'], KMG: ['Kunming', '昆明', '昆明', '쿤밍'], TSN: ['Tianjin', '天津', '天津', '톈진'],
  TAO: ['Qingdao', '青島', '青島', '칭다오'], WUH: ['Wuhan', '武漢', '武漢', '우한'], CGO: ['Zhengzhou', '鄭州', '鄭州', '정저우'], CSX: ['Changsha', '長沙', '長沙', '창사'],
  FOC: ['Fuzhou', '福州', '福州', '푸저우'], HAK: ['Haikou', '海口', '海口', '하이커우'], SYX: ['Sanya', '三亜', '三亞', '싼야'], NGB: ['Ningbo', '寧波', '寧波', '닝보'],
  HKG: ['Hong Kong', '香港', '香港', '홍콩'], MFM: ['Macau', 'マカオ', '澳門', '마카오'],
  TPE: ['Taipei-Taoyuan', '台北(桃園)', '台北(桃園)', '타이베이(타오위안)'], TSA: ['Taipei-Songshan', '台北(松山)', '台北(松山)', '타이베이(쑹산)'],
  KHH: ['Kaohsiung', '高雄', '高雄', '가오슝'], RMQ: ['Taichung', '台中', '台中', '타이중'],
  // South-east and South Asia, Oceania
  SIN: ['Singapore', 'シンガポール', '新加坡', '싱가포르'], BKK: ['Bangkok', 'バンコク', '曼谷', '방콕'], DMK: ['Bangkok-Don Mueang', 'バンコク(ドンムアン)', '曼谷(廊曼)', '방콕(돈므앙)'],
  HKT: ['Phuket', 'プーケット', '布吉', '푸껫'], CNX: ['Chiang Mai', 'チェンマイ', '清邁', '치앙마이'], KUL: ['Kuala Lumpur', 'クアラルンプール', '吉隆坡', '쿠알라룸푸르'],
  CGK: ['Jakarta', 'ジャカルタ', '雅加達', '자카르타'], DPS: ['Bali', 'デンパサール(バリ)', '峇里', '발리'], MNL: ['Manila', 'マニラ', '馬尼拉', '마닐라'],
  CEB: ['Cebu', 'セブ', '宿霧', '세부'], SGN: ['Ho Chi Minh City', 'ホーチミン', '胡志明市', '호찌민'], HAN: ['Hanoi', 'ハノイ', '河內', '하노이'],
  DAD: ['Da Nang', 'ダナン', '峴港', '다낭'], PNH: ['Phnom Penh', 'プノンペン', '金邊', '프놈펜'], RGN: ['Yangon', 'ヤンゴン', '仰光', '양곤'],
  DEL: ['Delhi', 'デリー', '德里', '델리'], BOM: ['Mumbai', 'ムンバイ', '孟買', '뭄바이'], BLR: ['Bengaluru', 'ベンガルール', '班加羅爾', '벵갈루루'],
  KTM: ['Kathmandu', 'カトマンズ', '加德滿都', '카트만두'], CMB: ['Colombo', 'コロンボ', '科倫坡', '콜롬보'], DAC: ['Dhaka', 'ダッカ', '達卡', '다카'], KHI: ['Karachi', 'カラチ', '卡拉奇', '카라치'],
  SYD: ['Sydney', 'シドニー', '悉尼', '시드니'], MEL: ['Melbourne', 'メルボルン', '墨爾本', '멜버른'], BNE: ['Brisbane', 'ブリスベン', '布里斯本', '브리즈번'],
  PER: ['Perth', 'パース', '珀斯', '퍼스'], AKL: ['Auckland', 'オークランド', '奧克蘭', '오클랜드'], GUM: ['Guam', 'グアム', '關島', '괌'], HNL: ['Honolulu', 'ホノルル', '檀香山', '호놀룰루'],
  // Middle East, Europe, Americas
  DXB: ['Dubai', 'ドバイ', '杜拜', '두바이'], DOH: ['Doha', 'ドーハ', '多哈', '도하'], AUH: ['Abu Dhabi', 'アブダビ', '阿布扎比', '아부다비'], IST: ['Istanbul', 'イスタンブール', '伊斯坦堡', '이스탄불'],
  LHR: ['London-Heathrow', 'ロンドン(ヒースロー)', '倫敦(希斯路)', '런던(히스로)'], LGW: ['London-Gatwick', 'ロンドン(ガトウィック)', '倫敦(蓋特威克)', '런던(개트윅)'],
  CDG: ['Paris', 'パリ', '巴黎', '파리'], FRA: ['Frankfurt', 'フランクフルト', '法蘭克福', '프랑크푸르트'], MUC: ['Munich', 'ミュンヘン', '慕尼黑', '뮌헨'],
  AMS: ['Amsterdam', 'アムステルダム', '阿姆斯特丹', '암스테르담'], ZRH: ['Zurich', 'チューリッヒ', '蘇黎世', '취리히'], HEL: ['Helsinki', 'ヘルシンキ', '赫爾辛基', '헬싱키'],
  FCO: ['Rome', 'ローマ', '羅馬', '로마'], MXP: ['Milan', 'ミラノ', '米蘭', '밀라노'], MAD: ['Madrid', 'マドリード', '馬德里', '마드리드'], VIE: ['Vienna', 'ウィーン', '維也納', '빈'],
  JFK: ['New York-JFK', 'ニューヨーク(JFK)', '紐約(甘迺迪)', '뉴욕(JFK)'], EWR: ['New York-Newark', 'ニューヨーク(ニューアーク)', '紐約(紐瓦克)', '뉴욕(뉴어크)'],
  LAX: ['Los Angeles', 'ロサンゼルス', '洛杉磯', '로스앤젤레스'], SFO: ['San Francisco', 'サンフランシスコ', '三藩市', '샌프란시스코'], SEA: ['Seattle', 'シアトル', '西雅圖', '시애틀'],
  ORD: ['Chicago', 'シカゴ', '芝加哥', '시카고'], DFW: ['Dallas/Fort Worth', 'ダラス', '達拉斯', '댈러스'], IAD: ['Washington-Dulles', 'ワシントン', '華盛頓', '워싱턴'],
  ATL: ['Atlanta', 'アトランタ', '亞特蘭大', '애틀랜타'], BOS: ['Boston', 'ボストン', '波士頓', '보스턴'], YVR: ['Vancouver', 'バンクーバー', '溫哥華', '밴쿠버'],
  YYZ: ['Toronto', 'トロント', '多倫多', '토론토'], MEX: ['Mexico City', 'メキシコシティ', '墨西哥城', '멕시코시티']
};

/* German names used on Frankfurt's split-flap boards where they differ from English. */
window.ONWARD_CITY_DE = {
  MXP: 'Mailand', LIN: 'Mailand', BGY: 'Mailand-Bergamo', FCO: 'Rom', VCE: 'Venedig', NAP: 'Neapel', FLR: 'Florenz', PRG: 'Prag', WAW: 'Warschau',
  CPH: 'Kopenhagen', BRU: 'Brüssel', LIS: 'Lissabon', ATH: 'Athen', GVA: 'Genf', VIE: 'Wien', NCE: 'Nizza', PEK: 'Peking', PKX: 'Peking', DEL: 'Neu-Delhi',
  CAI: 'Kairo', MEX: 'Mexiko-Stadt', SIN: 'Singapur', HND: 'Tokio', NRT: 'Tokio', TFS: 'Teneriffa Süd', PMI: 'Palma de Mallorca', OTP: 'Bukarest',
  BEG: 'Belgrad', KRK: 'Krakau', GDN: 'Danzig', MOW: 'Moskau', SVO: 'Moskau', TLV: 'Tel Aviv', LHR: 'London-Heathrow', LCY: 'London-City',
  BUD: 'Budapest', SOF: 'Sofia', IST: 'Istanbul', DXB: 'Dubai', JFK: 'New York-JFK', EWR: 'New York-Newark', MUC: 'München', CGN: 'Köln/Bonn', NUE: 'Nürnberg'
};
