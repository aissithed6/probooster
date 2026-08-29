'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Mail, Phone, MapPin, Lock, CreditCard, Bell, Shield, LogOut, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { UserProfile } from '@/app/dashboard/types';
import { Icons } from '@/components/icons';

// Schéma de validation avec Zod
const profileFormSchema = z.object({
  fullName: z.string().min(2, { message: 'Le nom doit contenir au moins 2 caractères' }),
  email: z.string().email({ message: 'Adresse email invalide' }),
  phone: z.string().min(10, { message: 'Numéro de téléphone invalide' }),
  address: z.string().min(5, { message: 'L\'adresse est trop courte' }),
  city: z.string().min(2, { message: 'Ville invalide' }),
  postalCode: z.string().min(4, { message: 'Code postal invalide' }),
  country: z.string().min(2, { message: 'Pays invalide' }),
  bio: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

// Données factices pour les méthodes de paiement
const paymentMethods = [
  { id: '1', type: 'credit_card', last4: '4242', expiryDate: '12/25', isDefault: true },
  { id: '2', type: 'paypal', email: 'user@example.com', isDefault: false },
];

interface SettingsTabProps {
  profile: UserProfile | null;
  onSaveProfile?: (data: ProfileFormValues) => void;
  onChangePassword?: (currentPassword: string, newPassword: string) => void;
  onUpdatePaymentMethod?: (paymentMethod: any) => void;
  onDeleteAccount?: () => void;
}

export function SettingsTab({ 
  profile,
  onSaveProfile = () => {},
  onChangePassword = () => {},
  onUpdatePaymentMethod = () => {},
  onDeleteAccount = () => {},
}: SettingsTabProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [newPaymentMethod, setNewPaymentMethod] = useState({
    type: 'credit_card',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    nameOnCard: '',
    isDefault: false,
  });

  // Initialiser le formulaire avec react-hook-form
  const { register, handleSubmit, formState: { errors }, reset } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: profile?.name || '',
      email: profile?.email || '',
      phone: profile?.phone || '',
      address: profile?.address || '',
      city: profile?.city || '',
      postalCode: profile?.postalCode || '',
      country: profile?.country || 'France',
      bio: profile?.bio || '',
    },
  });

  // Soumettre le formulaire de profil
  const onSubmit = (data: ProfileFormValues) => {
    onSaveProfile(data);
    setIsEditing(false);
  };

  // Gérer l'ajout d'une méthode de paiement
  const handleAddPaymentMethod = () => {
    // Ici, vous intégrerez la logique pour ajouter une méthode de paiement
    console.log('Ajouter une méthode de paiement:', newPaymentMethod);
    setShowAddPayment(false);
    setNewPaymentMethod({
      type: 'credit_card',
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      nameOnCard: '',
      isDefault: false,
    });
  };

  // Gérer la suppression du compte
  const handleDeleteAccount = () => {
    onDeleteAccount();
    setShowDeleteConfirm(false);
    router.push('/');
  };

  return (
    <div>
      <Tabs 
        defaultValue="profile" 
        className="w-full"
        onValueChange={setActiveTab}
      >
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            Profil
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Sécurité
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="billing">
            <CreditCard className="h-4 w-4 mr-2" />
            Paiement
          </TabsTrigger>
        </TabsList>

      {/* Onglet Profil */}
      <TabsContent value="profile" className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Profil</CardTitle>
                <CardDescription>
                  Gérez les informations de votre profil et vos préférences
                </CardDescription>
              </div>
              {!isEditing ? (
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  Modifier le profil
                </Button>
              ) : (
                <div className="space-x-2">
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleSubmit(onSubmit)}>Enregistrer</Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="flex flex-col items-center space-y-4 mb-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile?.avatar} alt={profile?.name} />
                  <AvatarFallback>
                    {profile?.name
                      ?.split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <Button variant="outline" size="sm">
                    Changer de photo
                  </Button>
                )}
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nom complet</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="fullName"
                      className="pl-10"
                      disabled={!isEditing}
                      {...register('fullName')}
                    />
                  </div>
                  {errors.fullName && (
                    <p className="text-sm text-red-500">{errors.fullName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      className="pl-10"
                      disabled={!isEditing}
                      {...register('email')}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="phone"
                      className="pl-10"
                      disabled={!isEditing}
                      {...register('phone')}
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-sm text-red-500">{errors.phone.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Adresse</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-4 h-4 w-4 text-gray-400" />
                    <Textarea
                      id="address"
                      className="pl-10 min-h-[80px]"
                      disabled={!isEditing}
                      {...register('address')}
                    />
                  </div>
                  {errors.address && (
                    <p className="text-sm text-red-500">{errors.address.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">Ville</Label>
                  <Input
                    id="city"
                    disabled={!isEditing}
                    {...register('city')}
                  />
                  {errors.city && (
                    <p className="text-sm text-red-500">{errors.city.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postalCode">Code postal</Label>
                  <Input
                    id="postalCode"
                    disabled={!isEditing}
                    {...register('postalCode')}
                  />
                  {errors.postalCode && (
                    <p className="text-sm text-red-500">{errors.postalCode.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Pays</Label>
                  <Select disabled={!isEditing}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un pays" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="france">France</SelectItem>
                      <SelectItem value="belgique">Belgique</SelectItem>
                      <SelectItem value="suisse">Suisse</SelectItem>
                      <SelectItem value="canada">Canada</SelectItem>
                      <SelectItem value="autres">Autres</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="bio">À propos de moi</Label>
                  <Textarea
                    id="bio"
                    className="min-h-[100px]"
                    placeholder="Dites-nous en plus sur vous..."
                    disabled={!isEditing}
                    {...register('bio')}
                  />
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Onglet Sécurité */}
      <TabsContent value="security" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Mot de passe</CardTitle>
            <CardDescription>
              Mettez à jour votre mot de passe pour sécuriser votre compte
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="currentPassword"
                    type="password"
                    className="pl-10"
                    placeholder="Entrez votre mot de passe actuel"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="newPassword"
                    type="password"
                    className="pl-10"
                    placeholder="Entrez votre nouveau mot de passe"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    className="pl-10"
                    placeholder="Confirmez votre nouveau mot de passe"
                  />
                </div>
              </div>
              
              <div className="pt-2">
                <Button type="submit">Mettre à jour le mot de passe</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Authentification à deux facteurs</CardTitle>
            <CardDescription>
              Ajoutez une couche de sécurité supplémentaire à votre compte
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Vérification en deux étapes</h4>
                <p className="text-sm text-gray-500">
                  Protégez votre compte avec une authentification à deux facteurs
                </p>
              </div>
              <Switch id="two-factor" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-100">
          <CardHeader>
            <CardTitle className="text-red-600">Zone dangereuse</CardTitle>
            <CardDescription>
              Ces actions sont irréversibles. Soyez certain de ce que vous faites.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h4 className="font-medium">Supprimer mon compte</h4>
                  <p className="text-sm text-gray-500">
                    Une fois supprimé, votre compte ne pourra pas être récupéré.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  className="mt-2 md:mt-0"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Supprimer mon compte
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Onglet Notifications */}
      <TabsContent value="notifications" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Préférences de notification</CardTitle>
            <CardDescription>
              Gérez les notifications que vous recevez par e-mail et sur l'application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-medium">E-mail</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-newsletter">Newsletter</Label>
                    <p className="text-sm text-gray-500">
                      Recevez des nouvelles, des offres spéciales et des mises à jour
                    </p>
                  </div>
                  <Switch id="email-newsletter" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-promotions">Promotions</Label>
                    <p className="text-sm text-gray-500">
                      Recevez des offres promotionnelles et des réductions exclusives
                    </p>
                  </div>
                  <Switch id="email-promotions" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-orders">Commandes</Label>
                    <p className="text-sm text-gray-500">
                      Recevez des mises à jour sur vos commandes et expéditions
                    </p>
                  </div>
                  <Switch id="email-orders" defaultChecked />
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <h4 className="font-medium">Notifications push</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="push-orders">Mises à jour des commandes</Label>
                    <p className="text-sm text-gray-500">
                      Recevez des notifications sur l'état de vos commandes
                    </p>
                  </div>
                  <Switch id="push-orders" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="push-promotions">Promotions</Label>
                    <p className="text-sm text-gray-500">
                      Soyez informé des offres spéciales et des soldes
                    </p>
                  </div>
                  <Switch id="push-promotions" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="push-account">Sécurité du compte</Label>
                    <p className="text-sm text-gray-500">
                      Recevez des alertes importantes concernant votre compte
                    </p>
                  </div>
                  <Switch id="push-account" defaultChecked />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-gray-50 px-6 py-4">
            <Button>Enregistrer les préférences</Button>
          </CardFooter>
        </Card>
      </TabsContent>

      {/* Onglet Paiement */}
      <TabsContent value="billing" className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Méthodes de paiement</CardTitle>
                <CardDescription>
                  Gérez vos méthodes de paiement pour des achats plus rapides
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowAddPayment(true)}
              >
                Ajouter une méthode
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {paymentMethods.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">Aucune méthode de paiement</h3>
                <p className="text-gray-500 mb-4">
                  Ajoutez une méthode de paiement pour des achats plus rapides
                </p>
                <Button onClick={() => setShowAddPayment(true)}>
                  Ajouter une méthode de paiement
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {paymentMethods.map((method) => (
                  <div 
                    key={method.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      {method.type === 'credit_card' ? (
                        <div className="h-10 w-16 rounded-md bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                          <Icons.creditCard className="h-6 w-6 text-white" />
                        </div>
                      ) : (
                        <div className="h-10 w-16 rounded-md bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center">
                          <Icons.paypal className="h-6 w-6 text-white" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium">
                          {method.type === 'credit_card' 
                            ? `Carte se terminant par •••• ${method.last4}` 
                            : `PayPal (${method.email})`}
                        </p>
                        <p className="text-sm text-gray-500">
                          {method.type === 'credit_card' 
                            ? `Expire le ${method.expiryDate}` 
                            : 'Paiement sécurisé via PayPal'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {method.isDefault && (
                        <Badge variant="outline" className="border-green-200 text-green-700">
                          Par défaut
                        </Badge>
                      )}
                      <Button variant="ghost" size="sm">
                        Modifier
                      </Button>
                      {!method.isDefault && (
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                          Supprimer
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Historique des factures</CardTitle>
            <CardDescription>
              Consultez et téléchargez vos factures précédentes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Facture #{1000 + i}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(2025, i, 15).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{(150 * i).toFixed(2)} €</p>
                    <p className="text-sm text-green-600">Payée</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Télécharger
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      </Tabs>

    {/* Modal d'ajout de méthode de paiement */}
    {showAddPayment && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Ajouter une méthode de paiement</CardTitle>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowAddPayment(false)}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Fermer</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Type de carte</Label>
                <Select 
                  value={newPaymentMethod.type}
                  onValueChange={(value) => setNewPaymentMethod({...newPaymentMethod, type: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un type de carte" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credit_card">Carte de crédit</SelectItem>
                    <SelectItem value="debit_card">Carte de débit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cardNumber">Numéro de carte</Label>
                <Input 
                  id="cardNumber" 
                  placeholder="1234 5678 9012 3456"
                  value={newPaymentMethod.cardNumber}
                  onChange={(e) => setNewPaymentMethod({...newPaymentMethod, cardNumber: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Date d'expiration</Label>
                  <Input 
                    id="expiryDate" 
                    placeholder="MM/AA"
                    value={newPaymentMethod.expiryDate}
                    onChange={(e) => setNewPaymentMethod({...newPaymentMethod, expiryDate: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cvv">CVV</Label>
                  <Input 
                    id="cvv" 
                    placeholder="123"
                    value={newPaymentMethod.cvv}
                    onChange={(e) => setNewPaymentMethod({...newPaymentMethod, cvv: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="nameOnCard">Nom sur la carte</Label>
                <Input 
                  id="nameOnCard" 
                  placeholder="Nom Prénom"
                  value={newPaymentMethod.nameOnCard}
                  onChange={(e) => setNewPaymentMethod({...newPaymentMethod, nameOnCard: e.target.value})}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="default-payment" 
                  checked={newPaymentMethod.isDefault}
                  onCheckedChange={(checked) => setNewPaymentMethod({...newPaymentMethod, isDefault: checked})}
                />
                <Label htmlFor="default-payment">Définir comme méthode de paiement par défaut</Label>
              </div>
              
              <div className="flex justify-end space-x-2 pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowAddPayment(false)}
                >
                  Annuler
                </Button>
                <Button onClick={handleAddPaymentMethod}>
                  Enregistrer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )}
    
    {/* Confirmation de suppression de compte */}
    {showDeleteConfirm && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-md border-red-200">
          <CardHeader className="space-y-4">
            <div className="flex items-center space-x-2 text-red-600">
              <Icons.alertTriangle className="h-6 w-6" />
              <CardTitle>Supprimer mon compte</CardTitle>
            </div>
            <CardDescription>
              Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible. Toutes vos données seront définitivement supprimées.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteConfirm(false)}
            >
              Annuler
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteAccount}
            >
              <Icons.trash2 className="mr-2 h-4 w-4" />
              Supprimer définitivement
            </Button>
          </CardFooter>
        </Card>
      </div>
    )}
    </div>
  );
}
