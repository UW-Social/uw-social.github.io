import * as ort from 'onnxruntime-web';

// ort.env.wasm.wasmPaths = '/';   // points to /public
ort.env.wasm.wasmPaths =
  'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/';

ort.env.wasm.proxy = true;
ort.env.logLevel = 'verbose';

let cachedSession: ort.InferenceSession | null = null;
let sessionPromise: Promise<ort.InferenceSession> | null = null;

import { AutoTokenizer } from '@huggingface/transformers';

let ortInitialized = false;

// Initialize ONNX Runtime only once
async function initializeORT() {
  if (ortInitialized) return;
  
  ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/';
  
  ortInitialized = true;
}


let cachedTokenizer: any = null;
let tokenizerPromise: Promise<any> | null = null;

export function getTokenizer(modelName?: string) {
  if (cachedTokenizer) return Promise.resolve(cachedTokenizer);

  console.log("checking tok promise");
  if (!tokenizerPromise) {
    tokenizerPromise = AutoTokenizer.from_pretrained(modelName ?? 'sentence-transformers/paraphrase-MiniLM-L3-v2')
      .then((tok) => {
        cachedTokenizer = tok;
        tokenizerPromise = null;
        return tok;
      });
  }

  console.log("loaded token");
  return tokenizerPromise;
}

/**
 * Load and cache the ONNX model session.
 */
export function getSession(modelPath?: string): Promise<ort.InferenceSession> {
  if (cachedSession) return Promise.resolve(cachedSession);

  initializeORT(); // Ensure ORT is initialized before creating session

  console.log("Checking promise");

  if (!sessionPromise) {
    console.log("No promise found");
    sessionPromise = ort.InferenceSession.create('/models/model_qint8_arm64.onnx')
      .then((session) => {
        console.log("Beginning session creation");
        cachedSession = session;
        console.log("Caching session");
        sessionPromise = null; // clear the promise after initialization
        return session;
      }).catch(err => {
        console.log("Something went wrong:", err);
      });
  }

  return sessionPromise;
}

/**
 * Run the ONNX model on a single input string and return the vector embedding.
 */
export async function getPhraseVec(
  inputText: string,
  modelName?: string,
  modelPath?: string
): Promise<Float32Array> {
  try {
    // Load tokenizer and model session (cached)
    console.log('Current backend:', ort.env.wasm.wasmPaths);
    console.log('Loading tokenizer and session...');
    const [tokenizer, session] = await Promise.all([
      getTokenizer(modelName),
      getSession(modelPath),
    ]);
    console.log('Tokenizer and session loaded.');

    const maxLen = 32;

    // Tokenize with padding and truncation
    const encoded = await tokenizer(inputText, {
      padding: true,
      truncation: true,
      max_length: maxLen,
      return_tensor: false,
    });

    // Prepare input tensors with padding
    const inputIds = new BigInt64Array(maxLen).fill(0n);
    const attentionMask = new BigInt64Array(maxLen).fill(0n);

    const length = Math.min(encoded.input_ids.length, maxLen);
    for (let i = 0; i < length; i++) {
      inputIds[i] = BigInt(encoded.input_ids[i]);
      attentionMask[i] = BigInt(encoded.attention_mask[i]);
    }

    const inputIdsTensor = new ort.Tensor('int64', inputIds, [1, maxLen]);
    const attentionMaskTensor = new ort.Tensor('int64', attentionMask, [1, maxLen]);

    // Prepare feeds - confirm these input names from your ONNX model!
    const feeds: Record<string, ort.Tensor> = {
      input_ids: inputIdsTensor,
      attention_mask: attentionMaskTensor,
    };

    const tokenTypeIds = new BigInt64Array(maxLen).fill(0n);
    const tokenTypeIdsTensor = new ort.Tensor('int64', tokenTypeIds, [1, maxLen]);
    feeds['token_type_ids'] = tokenTypeIdsTensor;

    console.log('running')

    // Run inference
    const results = await session.run(feeds);

    // Flexible output tensor extraction
    const outputTensor = results['sentence_embedding'] ||
                         results['output'] ||
                         results[Object.keys(results)[0]];

    return outputTensor.data as Float32Array;
  } catch (error) {
    console.error('Error in getPhraseVec:', error);
    throw error;
  }
}

/**
 * Batch inference: process multiple input strings at once.
 */
export async function getPhraseVecBatch(
  inputTexts: string[],
  modelName?: string,
  modelPath?: string
): Promise<Float32Array[]> {
  try {
    // Load tokenizer and model session (cached)
    const [tokenizer, session] = await Promise.all([
      getTokenizer(modelName),
      getSession(modelPath),
    ]);

    const maxLen = 32;
    const batchSize = inputTexts.length;

    // Tokenize all inputs
    const encodedBatch = await Promise.all(
      inputTexts.map(text =>
        tokenizer(text, {
          padding: true,
          truncation: true,
          max_length: maxLen,
          return_tensor: false,
        })
      )
    );

    // Prepare batch tensors
    const inputIds = new Int32Array(batchSize * maxLen).fill(0);
    const attentionMask = new Int32Array(batchSize * maxLen).fill(0);

    encodedBatch.forEach((encoded, batchIdx) => {
      const offset = batchIdx * maxLen;
      const length = Math.min(encoded.input_ids.length, maxLen);
      for (let i = 0; i < length; i++) {
        inputIds[offset + i] = encoded.input_ids[i];
        attentionMask[offset + i] = encoded.attention_mask[i];
      }
    });

    const inputIdsTensor = new ort.Tensor('int32', inputIds, [batchSize, maxLen]);
    const attentionMaskTensor = new ort.Tensor('int32', attentionMask, [batchSize, maxLen]);

    const feeds: Record<string, ort.Tensor> = {
      input_ids: inputIdsTensor,
      attention_mask: attentionMaskTensor,
    };

    // Run batch inference
    const results = await session.run(feeds);

    const outputTensor = results['sentence_embedding'] ||
                         results['output'] ||
                         results[Object.keys(results)[0]];

    const data = outputTensor.data as Float32Array;
    const embeddingSize = data.length / batchSize;

    const embeddings: Float32Array[] = [];
    for (let i = 0; i < batchSize; i++) {
      embeddings.push(data.slice(i * embeddingSize, (i + 1) * embeddingSize));
    }

    return embeddings;
  } catch (error) {
    console.error('Error in getPhraseVecBatch:', error);
    throw error;
  }
}
