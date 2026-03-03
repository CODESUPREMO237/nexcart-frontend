export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-5xl font-bold mb-6">About NexCart</h1>
      <div className="prose max-w-none">
        <p className="text-xl text-muted-foreground mb-8">
          Welcome to NexCart - Your Ultimate AI-Powered Shopping Destination
        </p>
        
        <h2 className="text-3xl font-bold mb-4">Our Story</h2>
        <p className="mb-6">
          Founded in 2024, NexCart revolutionizes online shopping by combining cutting-edge AI technology 
          with an extensive product catalog. We believe shopping should be personal, efficient, and enjoyable.
        </p>

        <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
        <p className="mb-6">
          To provide every customer with a personalized shopping experience powered by artificial intelligence, 
          delivering the right products at the right time.
        </p>

        <h2 className="text-3xl font-bold mb-4">Why Choose NexCart?</h2>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li>AI-powered product recommendations tailored to your preferences</li>
          <li>Secure and fast checkout process</li>
          <li>Free shipping on orders over 50 FCFA</li>
          <li>30-day hassle-free returns</li>
          <li>24/7 customer support</li>
          <li>Wide selection of quality products</li>
        </ul>
      </div>
    </div>
  )
}
