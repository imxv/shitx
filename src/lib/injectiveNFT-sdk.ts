import { 
  MsgExecuteContractCompat,
  ChainGrpcAuthApi,
  ChainGrpcWasmApi,
  TxGrpcApi,
  BaseAccount,
  ChainRestAuthApi,
  createTransaction,
  ChainId,
  getTxRawFromTxRawOrDirectSignResponse,
  TxRaw,
  hexToBase64
} from '@injectivelabs/sdk-ts';
import { 
  BigNumberInBase,
  DEFAULT_STD_FEE,
  DEFAULT_BLOCK_TIMEOUT_HEIGHT 
} from '@injectivelabs/utils';
import { GeneralException } from '@injectivelabs/exceptions';
import { nftRedis } from './redis';

// Injective Testnet 配置
const NETWORK = {
  chainId: ChainId.Testnet,
  grpcEndpoint: 'https://k8s.testnet.grpc-web.injective.network',
  restEndpoint: 'https://k8s.testnet.lcd.injective.network',
  rpcEndpoint: 'https://k8s.testnet.json-rpc.injective.network'
};

// 从环境变量获取配置
const PRIVATE_KEY = process.env.INJECTIVE_PRIVATE_KEY!;
const NFT_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_NFT_CONTRACT!;

// 创建 API 实例
const chainGrpcAuthApi = new ChainGrpcAuthApi(NETWORK.grpcEndpoint);
const chainGrpcWasmApi = new ChainGrpcWasmApi(NETWORK.grpcEndpoint);
const txApi = new TxGrpcApi(NETWORK.grpcEndpoint);

// 获取主钱包地址
export async function getMainWalletAddressSDK(): Promise<string> {
  // 从私钥推导地址（这里简化处理，实际应该使用 Injective 的地址格式）
  // Injective 地址格式是 inj1...
  const { getInjectiveAddress } = await import('@injectivelabs/sdk-ts');
  const wallet = await import('@injectivelabs/wallet-ts');
  
  // 这里需要正确的地址推导逻辑
  return '0x' + PRIVATE_KEY.slice(0, 40); // 临时返回，需要正确实现
}

// 查询 NFT 合约状态
export async function queryNFTContract(query: any): Promise<any> {
  try {
    const response = await chainGrpcWasmApi.fetchSmartContractState(
      NFT_CONTRACT_ADDRESS,
      Buffer.from(JSON.stringify(query)).toString('base64')
    );
    
    return JSON.parse(Buffer.from(response.data, 'base64').toString());
  } catch (error) {
    console.error('查询合约失败:', error);
    throw error;
  }
}

// 获取主钱包拥有的 NFT
export async function getAvailableTokenIdsSDK(): Promise<string[]> {
  try {
    // 查询主钱包拥有的所有 token
    const response = await queryNFTContract({
      tokens: {
        owner: await getMainWalletAddressSDK(),
        limit: 100
      }
    });
    
    return response.tokens || [];
  } catch (error) {
    console.error('获取可用 NFT 失败:', error);
    return [];
  }
}

// 转移 NFT（使用 Injective SDK）
export async function transferNFTWithSDK(
  toAddress: string, 
  tokenId: string
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    const fromAddress = await getMainWalletAddressSDK();
    
    // 创建转移消息
    const msg = MsgExecuteContractCompat.fromJSON({
      contractAddress: NFT_CONTRACT_ADDRESS,
      sender: fromAddress,
      msg: {
        transfer_nft: {
          recipient: toAddress,
          token_id: tokenId
        }
      }
    });

    // 获取账户信息
    const accountDetails = await chainGrpcAuthApi.fetchAccount(fromAddress);
    const baseAccount = BaseAccount.fromRestApi(accountDetails);
    
    // 创建交易
    const { signDoc } = createTransaction({
      message: msg,
      memo: 'ShitX NFT Transfer',
      fee: DEFAULT_STD_FEE,
      pubKey: baseAccount.pubKey.key,
      sequence: baseAccount.sequence,
      accountNumber: baseAccount.accountNumber,
      chainId: NETWORK.chainId
    });

    // 签名交易（这里需要实现私钥签名逻辑）
    // const signature = await signTransaction(signDoc, PRIVATE_KEY);
    
    // 广播交易
    // const txRaw = getTxRawFromTxRawOrDirectSignResponse(signResponse);
    // const response = await txApi.broadcast(txRaw);
    
    // 临时返回，需要完整实现
    return {
      success: false,
      error: 'SDK implementation not complete'
    };
  } catch (error: any) {
    console.error('NFT 转移失败 (SDK):', error);
    return {
      success: false,
      error: error.message || 'Transfer failed'
    };
  }
}

// 获取 NFT 元数据（通过合约查询）
export async function getNFTMetadataSDK(tokenId: string): Promise<any> {
  try {
    const metadata = await queryNFTContract({
      nft_info: {
        token_id: tokenId
      }
    });
    
    return metadata;
  } catch (error) {
    console.error('获取 NFT 元数据失败:', error);
    return null;
  }
}