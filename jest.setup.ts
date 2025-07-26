// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import dotenv from 'dotenv';
import path from 'path';

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '.env.local') });
dotenv.config({ path: path.join(__dirname, '.env') });

// Mock 环境变量（用于测试）
process.env.NEXT_PUBLIC_RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://k8s.testnet.json-rpc.injective.network/';
process.env.NEXT_PUBLIC_NFT_CONTRACT = process.env.NEXT_PUBLIC_NFT_CONTRACT || '0x3a4DDe2f8ac852858b956EBBC0CC5D2C4205CCcE';
process.env.NEXT_PUBLIC_ADMIN_WALLET = process.env.NEXT_PUBLIC_ADMIN_WALLET || '0x53021a66d9cf6Dff7aD234B32FE2d6E5C07f5E4f';
process.env.NEXT_PUBLIC_SHITX_COIN_CONTRACT = process.env.NEXT_PUBLIC_SHITX_COIN_CONTRACT || '0x1D413c9592E710b489c8E50f74de5d72b28ED499';

