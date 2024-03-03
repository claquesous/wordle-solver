import { processNode } from './node.js'

processNode(process.argv[2], [], true).then(() => console.log('done'))

