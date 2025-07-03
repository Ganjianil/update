import React from "react";
import Hero from "./Hero";
import Category from "./Category";
import Photo from "./Photo";
import Statics from "./Statics";
import Ratings from "./Ratings";
import Contact from "./Contact";
import Footer from "./Footer";
import AddProduct from "./Addproduct";
import Manageproducts from "./Manageproducts";
import ManageCategories from "./ManageCategories";
import ManageCupons from "./ManageCoupons"
import ViewOrders from "./ViewOrders"
import Photos from "./Photos";
import AdminDashboard from "./AdminDashboard"
import Search from "./Search"
import AddPreOrderProduct from "./AddPreOrderProduct";
import PreOrderProducts from "./PreOrderProducts";
import GoogleFormButton from "./GoogleFormButton";
const Home = () => {
  return (
    <>
  
      <Search />
      <Hero />
      <Category />
      <Photo />
      <Statics />
      <Ratings />
      <Contact />
      <Footer />
    
    
      
    
    </>
  );
};

export default Home;
