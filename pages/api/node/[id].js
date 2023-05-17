import { loadNode, processNode } from '../../../node.js'

export default async function handler(req, res) {
  const { id } = req.query
  try {
    let node = loadNode(id)
    if (!node.guessOutcomes) {
      await processNode(id)
      node = loadNode(id)
    }
    res.status(200).send(node)
  }
  catch (e) {
    res.status(500).send(e)
  }
}

