import CartProductModel from "../models/cartproduct.model.js";
import UserModel from "../models/user.model.js";
import ProductModel from "../models/product.model.js";


// -------------------- HELPER: Calculate Price with Discount --------------------
const calcSubTotal = (price, discount = 0, qty = 1) => {
  const finalPrice = Number(price) - Math.ceil((Number(price) * Number(discount)) / 100);
  return Number((finalPrice * qty).toFixed(2));
};


// -------------------- ADD TO CART --------------------
export const addToCartItemController = async (request, response) => {
  try {
    const userId = request.userId;
    const { productId } = request.body;

    if (!productId) {
      return response.status(400).json({
        message: "Provide productId",
        error: true,
        success: false
      });
    }

    const checkItemCart = await CartProductModel.findOne({ userId, productId });
    if (checkItemCart) {
      return response.status(400).json({
        message: "Item already in cart"
      });
    }

    const product = await ProductModel.findById(productId);
    if (!product) {
      return response.status(404).json({
        message: "Product not found",
        error: true,
        success: false
      });
    }

    const subTotalAmt = calcSubTotal(product.price, product.discount, 1);

    const cartItem = new CartProductModel({
      quantity: 1,
      userId,
      productId,
      subTotalAmt
    });
    const save = await cartItem.save();

    await UserModel.updateOne({ _id: userId }, {
      $push: { shopping_cart: productId }
    });

    return response.json({
      data: save,
      message: "Item added successfully",
      error: false,
      success: true
    });

  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false
    });
  }
};


// -------------------- GET CART ITEMS --------------------
export const getCartItemController = async (request, response) => {
  try {
    const userId = request.userId;

    const cartItems = await CartProductModel.find({ userId }).populate('productId');

    // Ensure subTotalAmt always correct
    const updatedCartItems = await Promise.all(cartItems.map(async (item) => {
      const product = item.productId;
      if (product) {
        const subTotalAmt = calcSubTotal(product.price, product.discount, item.quantity);
        if (subTotalAmt !== Number(item.subTotalAmt)) {
          await CartProductModel.updateOne(
            { _id: item._id },
            { $set: { subTotalAmt } }
          );
          return { ...item.toObject(), subTotalAmt };
        }
      }
      return item;
    }));

    return response.json({
      data: updatedCartItems,
      error: false,
      success: true
    });

  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false
    });
  }
};


// -------------------- UPDATE CART ITEM QTY --------------------
export const updateCartItemQtyController = async (request, response) => {
  try {
    const userId = request.userId;
    const { _id, qty } = request.body;

    if (!_id || !qty) {
      return response.status(400).json({
        message: "Provide _id and qty"
      });
    }

    const cartItem = await CartProductModel.findOne({ _id, userId }).populate('productId');
    if (!cartItem) {
      return response.status(404).json({
        message: "Cart item not found",
        error: true,
        success: false
      });
    }

    const subTotalAmt = calcSubTotal(cartItem.productId.price, cartItem.productId.discount, qty);

    await CartProductModel.updateOne(
      { _id, userId },
      { quantity: qty, subTotalAmt }
    );

    return response.json({
      message: "Updated cart",
      success: true,
      error: false,
      data: { _id, qty, subTotalAmt }
    });

  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false
    });
  }
};


// -------------------- DELETE CART ITEM --------------------
export const deleteCartItemQtyController = async (request, response) => {
  try {
    const userId = request.userId;
    const { _id } = request.body;

    if (!_id) {
      return response.status(400).json({
        message: "Provide _id",
        error: true,
        success: false
      });
    }

    const deleteCartItem = await CartProductModel.deleteOne({ _id, userId });

    return response.json({
      message: "Item removed",
      error: false,
      success: true,
      data: deleteCartItem
    });

  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false
    });
  }
};
