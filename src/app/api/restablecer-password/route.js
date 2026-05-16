import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js'; // O el cliente que uses en tu backend

// Inicializamos el cliente de Supabase para el entorno del servidor
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(request) {
  try {
    const { id_usuario, nueva_contrasena, email_destino, nombre_usuario } = await request.json();

    // Validación básica de datos
    if (!id_usuario || !nueva_contrasena || !email_destino) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    // 1. Actualizamos la contraseña en tu tabla 'usuarios'
    const { error: dbError } = await supabase
      .from('usuarios')
      .update({ contrasena: nueva_contrasena })
      .eq('id_usuario', id_usuario);

    if (dbError) throw new Error('Error en BD: ' + dbError.message);

    // 2. Configuramos el transporte seguro usando las variables de entorno
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASS,
      },
    });

    // 3. Estructuramos el diseño del correo electrónico (HTML premium oscuro)
    const mailOptions = {
  from: `"Eurovision Contest" <${process.env.GMAIL_USER}>`,
  to: email_destino,
  subject: 'Restablecimiento de contraseña - Eurovision Contest',
  html: `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 20px; max-width: 550px; margin: 0 auto; color: #333333;">
      <h2 style="color: #0d6efd; font-size: 20px; font-weight: bold; margin-bottom: 20px;">Eurovision Contest</h2>
      
      <p style="font-size: 15px; line-height: 1.5;">Hola, <strong>${nombre_usuario}</strong>:</p>
      <p style="font-size: 15px; line-height: 1.5; color: #555555;">Recibimos una solicitud para restablecer el acceso a tu cuenta. A continuación, te proporcionamos una contraseña temporal de seguridad para que puedas iniciar sesión:</p>
      
      <div style="background-color: #f8f9fa; padding: 15px; text-align: center; border-radius: 6px; margin: 20px 0; border: 1px solid #dee2e6;">
        <span style="font-family: 'Courier New', Courier, monospace; font-size: 18px; font-weight: bold; color: #0d6efd; letter-spacing: 1px;">
          ${nueva_contrasena}
        </span>
      </div>

      <p style="font-size: 13px; color: #666666; line-height: 1.4; background-color: #fff3cd; padding: 12px; border-radius: 6px; border-left: 4px solid #ffc107;">
        <strong>Recomendación de seguridad:</strong> Recordá ingresar a la sección "Mi Perfil" dentro de la aplicación para cambiar esta clave temporal por una personal una vez que hayas iniciado sesión.
      </p>
      
      <hr style="border: 0; border-top: 1px solid #eeeeee; margin-top: 30px; margin-bottom: 20px;" />
      <p style="font-size: 12px; color: #999999; text-align: center;">Sistema de Gestión de Votos Oficial. Por favor, no respondas a este mensaje automático.</p>
    </div>
  `,
};

    // 4. Enviamos el mail de forma asíncrona
    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, message: 'Proceso completado con éxito.' });

  } catch (error) {
    console.error('Error en la API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}