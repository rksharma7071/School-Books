import React, { useEffect, useState } from 'react'
import InputField from '../../components/UI/InputField'
import Button from '../../components/UI/Button';

function Contact() {
    const [contact, setContact] = useState({ name: "", phone: "", subject: "", email: "", message: "", });
    const [loading, setLoading] = useState(false);
    const handleChange = (e) => {
        setContact({ ...contact, [e.target.name]: e.target.value.trim() })
    };

    const handleContactForm = async () => {
        setLoading(true)
        await new Promise((resolve) => setTimeout(resolve, 1500));
        
        const cleanedData = {
            name: contact.name.trim(),
            phone: contact.phone.trim(),
            email: contact.email.trim(),
            subject: contact.subject.trim(),
            message: contact.message.trim(),
        };

        console.log("Cleaned Contact Form:", cleanedData);

        setLoading(false)
    }

    return (
        <div className="bg-slate-50 py-16">
            <div className="max-w-6xl mx-auto px-6">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
                    <div className="space-y-6">
                        <h1 className="text-4xl font-bold text-gray-900">Contact Us</h1>
                        <h2 className="text-lg font-semibold text-gray-700">We’d love to hear from you!</h2>
                        <p className="text-gray-600 leading-relaxed">Whether you have a question about our books, need help with an order, or want to share feedback, our team is here to help you every step of the way.</p>
                        <div className="space-y-4 pt-6">
                            <div>
                                <p className="font-semibold text-gray-800">📧 Email</p>
                                <p className="text-gray-600">support@yourwebsite.com</p>
                            </div>

                            <div>
                                <p className="font-semibold text-gray-800">📞 Phone</p>
                                <p className="text-gray-600">+91 9XXXXXXXXX</p>
                            </div>

                            <div>
                                <p className="font-semibold text-gray-800">🕘 Working Hours</p>
                                <p className="text-gray-600">Mon – Sat, 9:00 AM – 6:00 PM</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">Send Us a Message</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputField name="name" placeholder="Full Name" value={contact.name} onChange={handleChange} />
                            <InputField name="phone" placeholder="Phone Number" value={contact.phone} onChange={handleChange} />
                            <InputField name="email" placeholder="Email Address" value={contact.email} onChange={handleChange} />
                            <InputField name="subject" placeholder="Subject" value={contact.subject} onChange={handleChange} />
                            <div className="md:col-span-2">
                                <InputField name="message" placeholder="Your Message" value={contact.message} onChange={handleChange} textarea />
                            </div>

                        </div>
                        <Button children={loading ? "Sending..." : "Send Message"} variant={"primary"} disabled={loading} onClick={handleContactForm} className='mt-3' />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Contact