-- Insert sample fixture categories
INSERT INTO fixture_categories (name, description, display_order) VALUES
('Toilets', 'Toilet fixtures and accessories', 1),
('Sinks & Faucets', 'Bathroom sinks, vanities, and faucets', 2),
('Showers & Tubs', 'Shower systems, bathtubs, and related fixtures', 3),
('Lighting', 'Bathroom lighting fixtures', 4),
('Hardware', 'Towel bars, hooks, and other bathroom hardware', 5),
('Flooring', 'Bathroom flooring options', 6),
('Countertops', 'Bathroom countertop materials', 7),
('Cabinetry', 'Bathroom cabinets and storage', 8);

-- Insert sample fixture options
INSERT INTO fixture_options (category_id, name, description, brand, model, size, material, color, base_price, installation_cost, is_active) VALUES
-- Toilets
((SELECT id FROM fixture_categories WHERE name = 'Toilets'), 'Standard Toilet', 'Two-piece toilet with elongated bowl', 'Kohler', 'Cimarron', '12" rough-in', 'Ceramic', 'White', 299.99, 150.00, true),
((SELECT id FROM fixture_categories WHERE name = 'Toilets'), 'Comfort Height Toilet', 'ADA compliant comfort height toilet', 'Toto', 'Ultramax II', '12" rough-in', 'Ceramic', 'White', 399.99, 150.00, true),
((SELECT id FROM fixture_categories WHERE name = 'Toilets'), 'Smart Toilet', 'Bidet toilet with heated seat and remote', 'Kohler', 'Veil', '12" rough-in', 'Ceramic', 'White', 1299.99, 200.00, true),

-- Sinks & Faucets
((SELECT id FROM fixture_categories WHERE name = 'Sinks & Faucets'), 'Undermount Sink', 'Single bowl undermount bathroom sink', 'Kohler', 'Caxton', '22" x 19"', 'Vitreous China', 'White', 199.99, 100.00, true),
((SELECT id FROM fixture_categories WHERE name = 'Sinks & Faucets'), 'Vessel Sink', 'Glass vessel sink with modern design', 'Kohler', 'Purist', '18" diameter', 'Glass', 'Clear', 299.99, 125.00, true),
((SELECT id FROM fixture_categories WHERE name = 'Sinks & Faucets'), 'Single Handle Faucet', 'Chrome single handle bathroom faucet', 'Delta', 'Trinsic', '8" spread', 'Chrome', 'Chrome', 189.99, 75.00, true),
((SELECT id FROM fixture_categories WHERE name = 'Sinks & Faucets'), 'Widespread Faucet', 'Three-hole widespread bathroom faucet', 'Moen', 'Brushed Nickel', '8" spread', 'Brushed Nickel', 'Brushed Nickel', 249.99, 75.00, true),

-- Showers & Tubs
((SELECT id FROM fixture_categories WHERE name = 'Showers & Tubs'), 'Shower System', 'Complete shower system with rain head', 'Delta', 'In2ition', 'Multi-function', 'Chrome', 'Chrome', 599.99, 200.00, true),
((SELECT id FROM fixture_categories WHERE name = 'Showers & Tubs'), 'Freestanding Tub', 'Acrylic freestanding bathtub', 'Kohler', 'Sok', '60" x 30"', 'Acrylic', 'White', 1299.99, 300.00, true),
((SELECT id FROM fixture_categories WHERE name = 'Showers & Tubs'), 'Shower Door', 'Frameless glass shower door', 'DreamLine', 'Enigma', '32" x 72"', 'Glass', 'Clear', 499.99, 150.00, true),

-- Lighting
((SELECT id FROM fixture_categories WHERE name = 'Lighting'), 'Vanity Light', 'Three-light vanity fixture', 'Progress Lighting', 'P3000', '24" wide', 'Chrome', 'Chrome', 149.99, 75.00, true),
((SELECT id FROM fixture_categories WHERE name = 'Lighting'), 'Recessed Light', 'LED recessed downlight', 'Halo', 'H7RICAT', '6" diameter', 'White', 'White', 89.99, 50.00, true),
((SELECT id FROM fixture_categories WHERE name = 'Lighting'), 'Pendant Light', 'Modern pendant light fixture', 'Westinghouse', 'Lighting', 'Adjustable', 'Brushed Nickel', 'Brushed Nickel', 199.99, 100.00, true),

-- Hardware
((SELECT id FROM fixture_categories WHERE name = 'Hardware'), 'Towel Bar', '24" towel bar with mounting hardware', 'Moen', 'Brushed Nickel', '24"', 'Brushed Nickel', 'Brushed Nickel', 49.99, 25.00, true),
((SELECT id FROM fixture_categories WHERE name = 'Hardware'), 'Towel Ring', 'Towel ring with mounting hardware', 'Delta', 'Trinsic', 'Standard', 'Chrome', 'Chrome', 39.99, 25.00, true),
((SELECT id FROM fixture_categories WHERE name = 'Hardware'), 'Toilet Paper Holder', 'Toilet paper holder with mounting hardware', 'Kohler', 'Purist', 'Standard', 'Chrome', 'Chrome', 29.99, 20.00, true),

-- Flooring
((SELECT id FROM fixture_categories WHERE name = 'Flooring'), 'Ceramic Tile', '12x24 ceramic floor tile', 'Daltile', 'Restoration', '12" x 24"', 'Ceramic', 'Gray', 3.99, 8.00, true),
((SELECT id FROM fixture_categories WHERE name = 'Flooring'), 'Porcelain Tile', 'Large format porcelain tile', 'Marazzi', 'Timeless', '24" x 24"', 'Porcelain', 'White', 4.99, 8.00, true),
((SELECT id FROM fixture_categories WHERE name = 'Flooring'), 'Luxury Vinyl', 'Waterproof luxury vinyl plank', 'Coretec', 'Plus', '7" x 48"', 'Vinyl', 'Oak', 5.99, 6.00, true),

-- Countertops
((SELECT id FROM fixture_categories WHERE name = 'Countertops'), 'Quartz Countertop', 'Engineered quartz countertop', 'Caesarstone', 'Cloudburst Concrete', '2cm thick', 'Quartz', 'Gray', 89.99, 15.00, true),
((SELECT id FROM fixture_categories WHERE name = 'Countertops'), 'Granite Countertop', 'Natural granite countertop', 'MSI', 'Alaska White', '2cm thick', 'Granite', 'White/Gray', 79.99, 15.00, true),
((SELECT id FROM fixture_categories WHERE name = 'Countertops'), 'Marble Countertop', 'Natural marble countertop', 'MSI', 'Carrara', '2cm thick', 'Marble', 'White', 99.99, 15.00, true),

-- Cabinetry
((SELECT id FROM fixture_categories WHERE name = 'Cabinetry'), 'Vanity Cabinet', 'Single sink vanity cabinet', 'KraftMaid', 'Bath', '30" wide', 'Wood', 'White', 599.99, 150.00, true),
((SELECT id FROM fixture_categories WHERE name = 'Cabinetry'), 'Medicine Cabinet', 'Recessed medicine cabinet with mirror', 'Kohler', 'Purist', '24" x 30"', 'Chrome', 'Chrome', 299.99, 100.00, true),
((SELECT id FROM fixture_categories WHERE name = 'Cabinetry'), 'Storage Cabinet', 'Wall-mounted storage cabinet', 'IKEA', 'Godmorgon', '24" x 24"', 'White', 'White', 149.99, 75.00, true);
