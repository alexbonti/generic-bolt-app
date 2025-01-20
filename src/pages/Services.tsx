import React from 'react';
import { Link } from 'react-router-dom';
import { TicketCheck } from 'lucide-react';

export default function Services() {
  const services = [
    {
      id: 'tickets',
      title: 'Support Tickets',
      description: 'Get help from our support team',
      icon: TicketCheck,
      link: '/tickets',
    },
  ];

  return (
    <div className="py-8">
      <h1 className="text-3xl font-bold mb-8">Our Services</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => {
          const Icon = service.icon;
          return (
            <Link
              key={service.id}
              to={service.link}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center gap-4 mb-4">
                <Icon className="w-8 h-8 text-blue-600" />
                <h2 className="text-xl font-semibold">{service.title}</h2>
              </div>
              <p className="text-gray-600">{service.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
