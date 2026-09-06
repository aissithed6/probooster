import fs from 'fs';

let c = fs.readFileSync('components/layout/footer.tsx', 'utf8');

const oldCode = `    try {
      const response = await fetch("/api/public/whatsapp-subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: whatsappNumber,
          interests: selectedInterests,
          source: "footer"
        })
      })

      const data = await response.json()

      if (data.success) {
        setDetectedCountry({ name: data.data.country, flag: data.data.flag })
        setShowSuccessModal(true)
        setWhatsappNumber("")
        setSelectedInterests([])
        setSubscriberCount(prev => (prev || 0) + 1)
      } else {
        toast.error(data.error || "Une erreur est survenue. Veuillez réessayer.")
      }
    } catch (error) {
      console.error("Erreur lors de l'abonnement:", error)
      toast.error("Une erreur est survenue. Veuillez réessayer.")
    } finally {
      setIsSubmitting(false)
    }`;

const newCode = `    try {
      const response = await fetch("/api/public/whatsapp-subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: whatsappNumber,
          interests: selectedInterests,
          source: "footer"
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setDetectedCountry({ name: data.data.country, flag: data.data.flag })
        setShowSuccessModal(true)
        setWhatsappNumber("")
        setSelectedInterests([])
        setSubscriberCount(prev => (prev || 0) + 1)
        toast.success("Abonnement réussi ! Bienvenue dans WhatsApp Pulse !")
      } else {
        toast.error(data.error || "Une erreur est survenue. Veuillez réessayer.")
      }
    } catch (error) {
      console.error("Erreur lors de l'abonnement:", error)
      toast.error("Impossible de contacter le serveur. Vérifiez votre connexion.")
    } finally {
      setIsSubmitting(false)
    }`;

c = c.replace(oldCode, newCode);
fs.writeFileSync('components/layout/footer.tsx', c);
console.log('Footer error handling updated');