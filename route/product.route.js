import { Router } from 'express'
import auth from '../middleware/auth.js'
import { 
  createProductController, 
  deleteProductDetails, 
  getProductByCategory, 
  getProductByCategoryAndSubCategory, 
  getProductController, 
  getProductDetails, 
  searchProduct, 
  updateProductDetails,
  getRelatedProductsController,
  getOtherCategoryProductsController
} from '../controllers/product.controller.js'
import { admin } from '../middleware/Admin.js'

const productRouter = Router()

// create product
productRouter.post("/create", auth, admin, createProductController)

// get products
productRouter.post('/get', getProductController)
productRouter.post("/get-product-by-category", getProductByCategory)
productRouter.post('/get-product-by-category-and-subcategory', getProductByCategoryAndSubCategory)
productRouter.post('/get-product-details', getProductDetails)

// update product
productRouter.put('/update-product-details', auth, admin, updateProductDetails)

// delete product
productRouter.delete('/delete-product', auth, admin, deleteProductDetails)

// search product 
productRouter.post('/search-product', searchProduct)

// related products
productRouter.post('/get-related-products', getRelatedProductsController)

// other category products
productRouter.post('/get-other-category-products', getOtherCategoryProductsController)

export default productRouter
