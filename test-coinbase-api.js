// Coinbase API 진단 스크립트
// Node.js로 실행: node test-coinbase-api.js

const https = require('https');

// 테스트할 심볼
const TEST_SYMBOLS = ['BTC-USD', 'ETH-USD', 'SOL-USD'];

// 1. 캔들 API 테스트
function testCandles(productId) {
  return new Promise((resolve, reject) => {
    const end = Math.floor(Date.now() / 1000);
    const start = end - 3600; // 1시간 전
    
    const url = `https://api.exchange.coinbase.com/products/${productId}/candles?start=${new Date(start * 1000).toISOString()}&end=${new Date(end * 1000).toISOString()}&granularity=300`;
    
    console.log(`\n📊 Testing CANDLES: ${productId}`);
    console.log(`URL: ${url}`);
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          const candles = JSON.parse(data);
          console.log(`✅ SUCCESS: ${candles.length} candles received`);
          console.log(`Sample: ${JSON.stringify(candles[0])}`);
          resolve({ success: true, count: candles.length, sample: candles[0] });
        } else {
          console.log(`❌ FAILED: HTTP ${res.statusCode}`);
          console.log(`Response: ${data}`);
          resolve({ success: false, status: res.statusCode, error: data });
        }
      });
    }).on('error', (err) => {
      console.log(`❌ ERROR: ${err.message}`);
      resolve({ success: false, error: err.message });
    });
  });
}

// 2. 24h Stats API 테스트
function testStats(productId) {
  return new Promise((resolve, reject) => {
    const url = `https://api.exchange.coinbase.com/products/${productId}/stats`;
    
    console.log(`\n📈 Testing STATS: ${productId}`);
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          const stats = JSON.parse(data);
          console.log(`✅ SUCCESS: Stats received`);
          console.log(`Open: ${stats.open}, High: ${stats.high}, Low: ${stats.low}, Last: ${stats.last}, Volume: ${stats.volume}`);
          resolve({ success: true, stats });
        } else {
          console.log(`❌ FAILED: HTTP ${res.statusCode}`);
          console.log(`Response: ${data}`);
          resolve({ success: false, status: res.statusCode, error: data });
        }
      });
    }).on('error', (err) => {
      console.log(`❌ ERROR: ${err.message}`);
      resolve({ success: false, error: err.message });
    });
  });
}

// 3. WebSocket 연결 테스트
function testWebSocket() {
  return new Promise((resolve) => {
    console.log(`\n🔌 Testing WEBSOCKET: wss://ws-feed.exchange.coinbase.com`);
    
    const ws = new (require('ws'))('wss://ws-feed.exchange.coinbase.com');
    let connected = false;
    
    ws.on('open', () => {
      connected = true;
      console.log('✅ WebSocket CONNECTED');
      
      // 구독 요청
      ws.send(JSON.stringify({
        type: 'subscribe',
        product_ids: ['BTC-USD'],
        channels: ['ticker']
      }));
    });
    
    ws.on('message', (data) => {
      const msg = JSON.parse(data);
      if (msg.type === 'ticker') {
        console.log(`✅ WebSocket DATA received: ${msg.product_id} @ ${msg.price}`);
        ws.close();
        resolve({ success: true, connected: true, receivedData: true });
      }
    });
    
    ws.on('error', (err) => {
      console.log(`❌ WebSocket ERROR: ${err.message}`);
      resolve({ success: false, error: err.message });
    });
    
    ws.on('close', () => {
      if (!connected) {
        console.log('❌ WebSocket CLOSED before connection');
        resolve({ success: false, error: 'Connection closed' });
      }
    });
    
    // 10초 타임아웃
    setTimeout(() => {
      ws.close();
      if (!connected) {
        resolve({ success: false, error: 'Connection timeout' });
      }
    }, 10000);
  });
}

// 4. 제한 사항 테스트 (300개 이상 요청)
function testPaginationLimit(productId) {
  return new Promise((resolve) => {
    const end = Math.floor(Date.now() / 1000);
    const start = end - (300 * 300); // 300개 * 5분 = 25시간
    
    const url = `https://api.exchange.coinbase.com/products/${productId}/candles?start=${new Date(start * 1000).toISOString()}&end=${new Date(end * 1000).toISOString()}&granularity=300`;
    
    console.log(`\n📋 Testing PAGINATION LIMIT (300+ candles): ${productId}`);
    console.log(`Requesting ~300 candles...`);
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          const candles = JSON.parse(data);
          console.log(`✅ Received: ${candles.length} candles`);
          console.log(`⚠️  Limit check: ${candles.length >= 300 ? 'LIMIT HIT (need pagination)' : 'OK'}`);
          resolve({ success: true, count: candles.length, limited: candles.length >= 300 });
        } else {
          console.log(`❌ FAILED: HTTP ${res.statusCode}`);
          resolve({ success: false, status: res.statusCode });
        }
      });
    }).on('error', (err) => {
      console.log(`❌ ERROR: ${err.message}`);
      resolve({ success: false, error: err.message });
    });
  });
}

// 전체 테스트 실행
async function runTests() {
  console.log('========================================');
  console.log('🧪 Coinbase API 진단 테스트');
  console.log('========================================');
  
  const results = {
    candles: [],
    stats: [],
    websocket: null,
    pagination: []
  };
  
  // REST API 테스트
  for (const symbol of TEST_SYMBOLS) {
    results.candles.push(await testCandles(symbol));
    results.stats.push(await testStats(symbol));
    results.pagination.push(await testPaginationLimit(symbol));
  }
  
  // WebSocket 테스트
  results.websocket = await testWebSocket();
  
  // 결과 요약
  console.log('\n========================================');
  console.log('📋 테스트 결과 요약');
  console.log('========================================');
  
  const candlesOk = results.candles.every(r => r.success);
  const statsOk = results.stats.every(r => r.success);
  const wsOk = results.websocket?.success;
  const paginationLimited = results.pagination.some(r => r.limited);
  
  console.log(`캔들 API: ${candlesOk ? '✅ 정상' : '❌ 실패'}`);
  console.log(`Stats API: ${statsOk ? '✅ 정상' : '❌ 실패'}`);
  console.log(`WebSocket: ${wsOk ? '✅ 정상' : '❌ 실패'}`);
  console.log(`페이지네이션: ${paginationLimited ? '⚠️ 300개 제한 있음' : '✅ 제한 없음'}`);
  
  console.log('\n========================================');
  console.log('💡 권장 사항');
  console.log('========================================');
  
  if (!candlesOk || !statsOk) {
    console.log('❌ Coinbase Exchange API가 작동하지 않습니다.');
    console.log('   → Coinbase Advanced Trade API로 마이그레이션 필요');
    console.log('   → 또는 Binance/Upbit API로 전환 고려');
  }
  
  if (paginationLimited) {
    console.log('⚠️  캔들 API 300개 제한 확인됨');
    console.log('   → 페이지네이션 로직 필수 구현');
  }
  
  if (!wsOk) {
    console.log('❌ WebSocket 연결 실패');
    console.log('   → wss://advanced-trade-ws.coinbase.com로 변경 필요');
  }
  
  console.log('\n========================================');
}

runTests().catch(console.error);
