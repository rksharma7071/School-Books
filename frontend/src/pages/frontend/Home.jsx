import { useContext } from 'react';
import BestSellingProduct from '../../components/frontend/BestSellingProduct.jsx'
import { BookContext } from '../../context/School.jsx';

function Home() {
    const { user, books, carts, orders, users, discounts, payments, reviews, cartItems, setCartItems, setLoading } = useContext(BookContext);

    // console.log("Book Provider: ", { books, carts, orders, users, discounts, payments, reviews });
    // console.log("VITE_ADMIN:", import.meta.env.VITE_ADMIN);
    // console.log("VITE_API: ", import.meta.env.VITE_API);

    return (
        <div>

            <BestSellingProduct />
        </div>
    )
}

export default Home