//(fs)=>File System
const fs = require('fs');
const path = require('path');
// stripe financial system and Saas Softwera as a serive provide api to payment processiong
const stripe = require('stripe')(process.env.STRIPE_KEY);
// to create and mainpulate PDF file
const PDFDocument = require('pdfkit');

const Product = require('../models/Product');
const Order = require('../models/Order');

const { fetchAllProducts, forwardError } = require('../utils');



/**-----------------------------------------
 * @desc  Inside the method, the fetchAllProducts function is called with five parameters:
 *  "shope/index", "Shope", "/", req, and res. The fetchAllProducts function is responsible for 
 * fetching all the products from the database. The results of the fetchAllProducts function are then passed to the next 
 * middleware function.
 * 
 ----------------------------------------------*/
//

exports.getIndex = (req, res, next) => {
    fetchAllProducts('shop/index', 'Shop', '/', req, res, next);
};
//get all products
exports.getAllProducts = async(req, res, next) => {
        fetchAllProducts('shop/product-list', 'All Product', '/products', req, res, next);
    }
    //get product
    // exports.getProduct = (req, res, next) => {
    //     Product.findById(req.params.productId)

//         .then((product) => {
//             res.render('shop/product-detail', {
//                     title: Product.title,
//                     path: '/products',
//                     product
//                 }).catch((err) => forwardError(err, next))
//                 //>>>>>>>>>>>catch(err => forwardError(err, next));
//         })
// }
exports.getProducts = (req, res, next) => {
    fetchAllProducts(
        'shop/product-list',
        'All Products',
        '/products',
        req,
        res,
        next
    );
};

//get Cart
exports.getCart = (req, res, next) => {
    req.user
        .populate('cart.products.productId')
        .then((user) => {
            const products = user.cart.products;
            res.render('shop/cart', {
                title: 'Your Cart',
                path: '/cart',
                products
            });
        }).catch(err => forwardError(err, next));
};

//create Cart

exports.postCart = (req, res, next) => {
    Product.findById(req.body.productId)
        .then((product) => req.user.addToCart(product))
        .then(() => res.redirect('/cart'))
        .catch(err => forwardError(err, next));
};

//Cart delet product
exports.postCartDeleteProduct = (req, res, next) => {
    req.user
        .deleteProductFromCart(req.body.productId)
        .then(() => res.redirect('/cart'))
        .catch(err => forwardError(err, next));
}

// function check Strip 
exports.getCheckout = (req, res, next) => {
    let products;
    req.user
        .populate('cart.products.productId')
        .then((user) => {
            products = user.cart.products;
            return stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: products.map(product => {
                    return {
                        name: product.productId.title,
                        description: product.productId.description,
                        amount: product.productId.price.toFixed(1) * 100,
                        currency: 'usd',
                        quantity: product.quantity
                    };
                }),
                // http://localhost:3000/checkout/success
                success_url: req.protocol + '://' + req.get('host') + '/checkout/success',
                // http://localhost:3000/checkout/cancel
                cancel_url: req.protocol + '://' + req.get('host') + '/checkout/cancel',
            });
        })
        .then(session => res.render('shop/checkout', {

            title: 'Checkout',
            path: null,
            products,
            totalPrice: products.reduce((price, product) => {
                return price + product.quantity * product.productId.price;
            }, 0),
            sessionId: session.id
        }))
        .catch(err => forwardError(err, next));
};

// Get check success check out
exports.getCheckoutSuccess = (req, res, next) => {
    req.user
        .populate('cart.products.productId')

    .then((user) => {
            const products = user.cart.products.map(
                prod => ({
                    product: {...prod.productId._doc },
                    quantity: prod.quantity
                })
            );
            return new Order({
                user: {
                    email: req.user.email,
                    userId: req.user
                },
                products
            });
        })
        .then(order => order.save())
        .then(() => req.user.clearCart())
        .then(() => res.redirect('/orders'))
        .catch(err => forwardError(err, next));
};


//get orders

exports.getOrders = (req, res, next) => {
    Order.find({ 'user.userId': req.user._id })
        .then((orders) => {
            res.render('shop/orders', {
                title: 'Your Orders',
                path: '/orders',
                orders
            });
        })
        .catch(err => forwardError(err, next));
};

//get invoice to Write pdf file to order
exports.getInvoice = (req, res, next) => {
    const orderId = req.params.orderId;
    Order.findById(orderId)
        .then(order => {
            if (!order) {
                return forwardError('No order found for id = ' + orderId, next);
            }
            if (order.user.userId.toString() !== req.user._id.toString()) {
                return forwardError('Unauthorized', next);
            }

            const invoiceName = 'invoice-' + orderId + '.pdf';
            const invoicePath = path.join('data', 'invoices', invoiceName);

            // fs.readFile(invoicePath, (err, data) => {
            //   if (err) {
            //     forwardError(err, next);
            //   }
            //   res.setHeader('Content-Type', 'application/pdf');
            //   res.setHeader(
            //     'Content-Disposition',
            //     'inline; filename="' + invoiceName + '"'
            //   );
            //   res.send(data);
            // });

            // const file = fs.createReadStream(invoicePath);
            // res.setHeader('Content-Type', 'application/pdf');
            // res.setHeader(
            //   'Content-Disposition',
            //   'inline; filename="' + invoiceName + '"'
            // );
            // file.pipe(res);

            const pdfDoc = new PDFDocument();
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader(
                'Content-Disposition',
                'inline; filename="' + invoiceName + '"'
            );
            pdfDoc.pipe(fs.createWriteStream(invoicePath));
            pdfDoc.pipe(res);

            pdfDoc.fontSize(26).text('Invoice', {
                underline: true
            });
            pdfDoc.text(' ');
            pdfDoc.text('-----------------------------------------------');
            pdfDoc.text(' ');
            let totalPrice = 0;
            order.products.forEach(prod => {
                pdfDoc.fontSize(14).text(
                    prod.product.title +
                    ' - ' +
                    prod.quantity +
                    ' x $' +
                    prod.product.price
                );
                totalPrice += prod.product.price * prod.quantity;
            });
            pdfDoc.text(' ');
            pdfDoc.fontSize(18).text('Total Price: $' + totalPrice);

            pdfDoc.end();
        })
        .catch(err => forwardError(err, next));
};