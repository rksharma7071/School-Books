import BestSellingProduct from '../../components/frontend/BestSellingProduct.jsx'
import Categories from '../../components/frontend/Categories.jsx'
import FeaturesBanner from '../../components/frontend/FeaturesBanner.jsx'
import Hero from '../../components/frontend/Hero.jsx'
import Newsletter from '../../components/frontend/Newsletter.jsx'

function Home() {
    return (
        <div>
            <Hero />
            <Categories />
            <BestSellingProduct />
            <FeaturesBanner />
            <Newsletter />
        </div>
    )
}

export default Home
