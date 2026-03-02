-- Criação da tabela profiles
CREATE TABLE profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    username text UNIQUE NOT NULL,
    pin text NOT NULL CHECK (char_length(pin) = 4),
    is_admin boolean DEFAULT false,
    created_at timestamp DEFAULT now()
);

-- Criação da tabela payments
CREATE TABLE payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES profiles(id),
    month_ref text NOT NULL,
    amount numeric DEFAULT 10.00,
    receipt_url text,
    status text CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at timestamp DEFAULT now()
);
-- Criação da tabela transactions
CREATE TABLE transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo text CHECK (tipo IN ('entrada', 'saida')) NOT NULL,
    valor numeric NOT NULL,
    descricao text,
    admin_id uuid REFERENCES profiles(id),
    created_at timestamp DEFAULT now()
);