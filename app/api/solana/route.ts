import { NextResponse } from 'next/server';

const SOLANA_RPC = 'https://api.mainnet-beta.solana.com';
const HELIUS_API = 'https://mainnet.helius-rpc.com';

// Jupiter API for price
const JUPITER_API = 'https://price.jup.ag/v4';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'price';
  const mint = searchParams.get('mint');
  
  try {
    if (action === 'price' && mint) {
      // Jupiter에서 가격 조회
      const res = await fetch(`${JUPITER_API}/price?ids=${mint}`);
      
      if (!res.ok) throw new Error(`Jupiter API error: ${res.status}`);
      
      const data = await res.json();
      return NextResponse.json({
        success: true,
        data: data.data[mint],
      });
    }
    
    if (action === 'account' && mint) {
      // Solana 계정 정보 조회
      const res = await fetch(SOLANA_RPC, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getAccountInfo',
          params: [mint, { encoding: 'base64' }],
        }),
      });
      
      if (!res.ok) throw new Error(`Solana RPC error: ${res.status}`);
      
      const data = await res.json();
      return NextResponse.json({
        success: true,
        data: data.result,
      });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Invalid action or missing parameters',
    }, { status: 400 });
    
  } catch (error: any) {
    console.error('Solana API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
