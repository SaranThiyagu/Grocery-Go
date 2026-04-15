'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    ArrowLeft,
    Search,
    RefreshCw,
    LogOut,
    Package,
    ShoppingCart,
    Plus,
} from 'lucide-react';
import Image from 'next/image';

interface Product {
    id: string;
    name: string;
    description: string | null;
    price: number;
    image: string | null;
    category: string | null;
    createdAt: string;
    updatedAt: string;
}

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        category: '',
        image: '',
    });

    const router = useRouter();

    useEffect(() => {
        // Get current user from localStorage
        if (typeof window !== 'undefined') {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                try {
                    const user = JSON.parse(userStr);
                    setCurrentUser(user);
                } catch (error) {
                    console.error('Error parsing user data:', error);
                }
            }
        }

        // Fetch products from API
        const fetchProducts = async () => {
            try {
                const response = await fetch('/api/products');
                if (response.ok) {
                    const data = await response.json();
                    setProducts(data);
                } else {
                    console.error('Failed to fetch products');
                }
            } catch (error) {
                console.error('Error fetching products:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    useEffect(() => {
        // Filter products based on search
        let filtered = products;

        if (searchTerm) {
            filtered = filtered.filter(product =>
                product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.category?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredProducts(filtered);
    }, [products, searchTerm]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    };

    const handleLogout = () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('user');
        }
        document.cookie = 'user=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';

        if (currentUser && !currentUser.isDummy) {
            import('firebase/auth').then(({ signOut }) => {
                import('@/lib/firebase').then(({ auth }) => {
                    signOut(auth).catch(console.error);
                }).catch(() => {
                    console.log('Firebase lib not available');
                });
            }).catch(() => {
                console.log('Firebase sign out skipped');
            });
        }
        router.push('/login');
    };

    const fetchProducts = async () => {
        try {
            const response = await fetch('/api/products');
            if (response.ok) {
                const data = await response.json();
                setProducts(data);
            } else {
                console.error('Failed to fetch products');
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    const handleCreateProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await fetch('/api/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.name,
                    description: formData.description || null,
                    price: parseFloat(formData.price),
                    category: formData.category || null,
                    image: formData.image || null,
                }),
            });

            if (response.ok) {
                // Reset form
                setFormData({
                    name: '',
                    description: '',
                    price: '',
                    category: '',
                    image: '',
                });
                setIsDialogOpen(false);
                // Refresh products list
                await fetchProducts();
            } else {
                const error = await response.json();
                alert(`Error: ${error.error || 'Failed to create product'}`);
            }
        } catch (error) {
            console.error('Error creating product:', error);
            alert('Failed to create product');
        } finally {
            setIsSubmitting(false);
        }
    };

    const availableImages = [
        '/images/products/apples.jpg',
        '/images/products/bananas.jpg',
        '/images/products/bread.jpg',
        '/images/products/butter.jpg',
        '/images/products/chicken.jpg',
        '/images/products/coffee.jpg',
        '/images/products/eggs.jpg',
        '/images/products/milk.jpg',
        '/images/products/onions.jpg',
        '/images/products/rice.jpg',
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-amber-500 rounded-full flex items-center justify-center mx-auto">
                        <span className="text-white font-bold text-2xl">OF</span>
                    </div>
                    <p className="text-gray-600 mt-4">Loading products...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-4">
                            <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-amber-500 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-sm">OF</span>
                            </div>
                            <h1 className="text-xl font-bold text-gray-900">OrderFlow Admin</h1>
                        </div>

                        <div className="flex items-center space-x-4">
                            {currentUser && (
                                <div className="flex items-center space-x-3">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={currentUser.photoURL} alt={currentUser.displayName} />
                                        <AvatarFallback>{currentUser.displayName?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="text-right">
                                        <span className="text-sm font-medium text-gray-700 block">{currentUser.displayName}</span>
                                        {currentUser.isDummy && (
                                            <span className="text-xs text-amber-600">Demo Account</span>
                                        )}
                                    </div>
                                </div>
                            )}
                            <Button
                                onClick={handleLogout}
                                variant="outline"
                                size="sm"
                                className="border-gray-200 hover:bg-gray-50"
                            >
                                <LogOut className="h-4 w-4 mr-2" />
                                Logout
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Back Button */}
                <div className="mb-6">
                    <Button
                        onClick={() => router.push('/admin')}
                        variant="ghost"
                        className="text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Dashboard
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card className="bg-white border-0 shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Products</p>
                                    <p className="text-2xl font-bold text-gray-900">{filteredProducts.length}</p>
                                </div>
                                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                                    <Package className="h-6 w-6 text-indigo-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-0 shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Categories</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {new Set(products.map(p => p.category).filter(Boolean)).size}
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                    <ShoppingCart className="h-6 w-6 text-green-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-0 shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Avg. Price</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {formatCurrency(
                                            products.length > 0
                                                ? products.reduce((sum, p) => sum + p.price, 0) / products.length
                                                : 0
                                        )}
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                                    <RefreshCw className="h-6 w-6 text-amber-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Products Table */}
                <Card className="bg-white border-0 shadow-sm">
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 gap-3">
                            <div>
                                <CardTitle>Products</CardTitle>
                                <CardDescription>Manage your product inventory</CardDescription>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="relative flex-1 sm:flex-initial">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Search products..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 w-full sm:w-64"
                                    />
                                </div>
                                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white">
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Product
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[500px]">
                                        <DialogHeader>
                                            <DialogTitle>Add New Product</DialogTitle>
                                            <DialogDescription>
                                                Fill in the details to add a new product to your inventory.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <form onSubmit={handleCreateProduct}>
                                            <div className="grid gap-4 py-4">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="name">Product Name *</Label>
                                                    <Input
                                                        id="name"
                                                        value={formData.name}
                                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                        placeholder="e.g., Fresh Apples"
                                                        required
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="price">Price (₹) *</Label>
                                                    <Input
                                                        id="price"
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        value={formData.price}
                                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                                        placeholder="e.g., 50.00"
                                                        required
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="category">Category</Label>
                                                    <Input
                                                        id="category"
                                                        value={formData.category}
                                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                                        placeholder="e.g., Fruits, Vegetables, Dairy"
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="image">Product Image</Label>
                                                    <Select
                                                        value={formData.image}
                                                        onValueChange={(value) => setFormData({ ...formData, image: value })}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select an image" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {availableImages.map((img) => (
                                                                <SelectItem key={img} value={img}>
                                                                    {img.split('/').pop()?.replace('.jpg', '')}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="description">Description</Label>
                                                    <Textarea
                                                        id="description"
                                                        value={formData.description}
                                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                        placeholder="Enter product description..."
                                                        rows={3}
                                                    />
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => setIsDialogOpen(false)}
                                                    disabled={isSubmitting}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    type="submit"
                                                    disabled={isSubmitting}
                                                    className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700"
                                                >
                                                    {isSubmitting ? 'Creating...' : 'Create Product'}
                                                </Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-b border-gray-100">
                                        <TableHead className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Image
                                        </TableHead>
                                        <TableHead className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Product Name
                                        </TableHead>
                                        <TableHead className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Category
                                        </TableHead>
                                        <TableHead className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Price
                                        </TableHead>
                                        <TableHead className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Description
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="divide-y divide-gray-100">
                                    {filteredProducts.map((product) => (
                                        <TableRow
                                            key={product.id}
                                            className="hover:bg-gray-50 transition-colors"
                                        >
                                            <TableCell className="px-6 py-4 whitespace-nowrap">
                                                <div className="h-16 w-16 relative rounded-lg overflow-hidden bg-gray-100">
                                                    {product.image ? (
                                                        <Image
                                                            src={product.image}
                                                            alt={product.name}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    ) : (
                                                        <div className="h-full w-full flex items-center justify-center">
                                                            <Package className="h-8 w-8 text-gray-400" />
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                            </TableCell>
                                            <TableCell className="px-6 py-4 whitespace-nowrap">
                                                {product.category ? (
                                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                        {product.category}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-sm text-gray-400">N/A</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-semibold text-gray-900">
                                                    {formatCurrency(product.price)}
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-6 py-4">
                                                <div className="text-sm text-gray-600 max-w-md truncate">
                                                    {product.description || 'No description'}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        {filteredProducts.length === 0 && (
                            <div className="text-center py-12">
                                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500">No products found</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
