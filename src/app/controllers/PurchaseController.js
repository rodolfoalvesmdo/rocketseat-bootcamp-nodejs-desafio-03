const Ad = require('../models/Ad')
const User = require('../models/User')
const Purchase = require('../models/Purchase')
const PurchaseMail = require('../jobs/PurchaseMail')
const Queue = require('../services/Queue')

class PurchaseController {
  async store (req, res) {
    const { ad, content } = req.body

    const purchaseAd = await Ad.findById(ad).populate('author')
    const user = await User.findById(req.userId)

    if (purchaseAd.purchasedBy) {
      return res.send({ error: 'Esse produto já foi vendido' })
    }
    const purchaseInfo = await Purchase.create({
      ...req.body,
      client: req.userId,
      ad_info: req.body.ad
    })

    // Envio de email com informações da Purchase
    Queue.create(PurchaseMail.key, {
      ad: purchaseAd,
      user,
      content
    }).save()

    return res.json(purchaseInfo)
  }

  async list (req, res) {
    const purchases = await Purchase.find()
    return res.json(purchases)
  }

  async show (req, res) {
    const purchaseDetails = await Purchase.findById(req.params.id)
      .populate('ad')
      .populate('client')
    return res.json(purchaseDetails)
  }

  async destroy (req, res) {
    await Purchase.findByIdAndDelete(req.params.id)
    return res.send()
  }

  async accept (req, res) {
    const purchaseAccepted = await Purchase.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    )
    await Ad.findByIdAndUpdate(
      purchaseAccepted.ad,
      {
        purchasedBy: req.params.id
      },
      { new: true }
    )
    res.json(purchaseAccepted)
  }
}

module.exports = new PurchaseController()
