import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { pinecone } from '@/utils/pinecone-client';
import { PINECONE_INDEX_NAME, PINECONE_NAME_SPACE } from '@/config/pinecone';
import { DirectoryLoader } from 'langchain/document_loaders/fs/directory';

import * as util from 'util';
import * as fs from 'fs';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';

/* Name of directory to retrieve your files from
   Make sure to add your PDF files inside the 'docs' folder
*/

export const ingestPdfFiles = async (userId: string, pdfBlob: Buffer) => {
  const filePath = 'tmp';
  try {
    const writeFileSync = util.promisify(fs.writeFile);
    await writeFileSync(`${filePath}/tmp.pdf`, pdfBlob, 'utf-8').then(() =>
      console.log('saved'),
    );

    const directoryLoader = new DirectoryLoader(filePath, {
      '.pdf': (path) => new PDFLoader(path),
    });

    // const loader = new PDFLoader(filePath);
    const rawDocs = await directoryLoader.load();

    /* Split text into chunks */
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const docs = (await textSplitter.splitDocuments(rawDocs)).map(
      (document) => ({
        pageContent: document.pageContent,
        metadata: { source: document.metadata.source },
      }),
    );
    console.log('split docs', docs);

    console.log('creating vector store...');
    /*create and store the embeddings in the vectorStore*/
    const embeddings = new OpenAIEmbeddings();
    const index = pinecone.Index(PINECONE_INDEX_NAME); //change to your own index name

    //embed the PDF documents
    await PineconeStore.fromDocuments(docs, embeddings, {
      pineconeIndex: index,
      namespace: PINECONE_NAME_SPACE,
      textKey: 'text',
    });
  } catch (error) {
    console.error('error', error);
    throw new Error('Failed');
  }
  console.log('Ingestion complete');
};
