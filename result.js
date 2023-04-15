import { nodeHeight } from './node.js';
import { regexToHash } from './regex.js';

nodeHeight(regexToHash('.....')).then(console.log);

