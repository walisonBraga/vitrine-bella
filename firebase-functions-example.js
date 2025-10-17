// Firebase Cloud Function para enviar emails de notificação de estoque
// Este código deve ser implementado no Firebase Functions

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Configurar transporter de email (usando Gmail como exemplo)
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: functions.config().email.user, // Configurar no Firebase: firebase functions:config:set email.user="seu@gmail.com"
    pass: functions.config().email.password // Configurar no Firebase: firebase functions:config:set email.password="sua_senha_app"
  }
});

exports.sendStockNotificationEmail = functions.https.onCall(async (data, context) => {
  try {
    const { to, productName, productUrl, unsubscribeUrl } = data;

    // Validar dados
    if (!to || !productName || !productUrl) {
      throw new functions.https.HttpsError('invalid-argument', 'Dados obrigatórios não fornecidos');
    }

    // Carregar template HTML
    const templatePath = path.join(__dirname, '../assets/email-templates/stock-notification.html');
    let htmlTemplate = fs.readFileSync(templatePath, 'utf8');

    // Substituir variáveis no template
    htmlTemplate = htmlTemplate.replace(/\{\{productName\}\}/g, productName);
    htmlTemplate = htmlTemplate.replace(/\{\{productUrl\}\}/g, productUrl);
    htmlTemplate = htmlTemplate.replace(/\{\{unsubscribeUrl\}\}/g, unsubscribeUrl);

    // Configurar email
    const mailOptions = {
      from: {
        name: 'VitrineBella',
        address: functions.config().email.user
      },
      to: to,
      subject: `🎉 ${productName} está disponível novamente! - VitrineBella`,
      html: htmlTemplate,
      text: `
        Boa notícia! O produto "${productName}" voltou ao estoque da VitrineBella!

        Acesse o link para ver o produto: ${productUrl}

        Não perca esta oportunidade! Produtos populares podem esgotar rapidamente.

        Atenciosamente,
        Equipe VitrineBella

        Para cancelar notificações: ${unsubscribeUrl}
      `
    };

    // Enviar email
    const result = await transporter.sendMail(mailOptions);

    console.log('Email enviado com sucesso:', result.messageId);

    return {
      success: true,
      messageId: result.messageId
    };

  } catch (error) {
    console.error('Erro ao enviar email:', error);
    throw new functions.https.HttpsError('internal', 'Erro interno ao enviar email');
  }
});

// Função para processar notificações quando um produto volta ao estoque
exports.processStockNotifications = functions.firestore
  .document('products/{productId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const productId = context.params.productId;

    // Verificar se o estoque mudou de 0 para > 0
    if (before.stock === 0 && after.stock > 0) {
      console.log(`Produto ${productId} voltou ao estoque. Processando notificações...`);

      try {
        // Buscar todas as notificações pendentes para este produto
        const notificationsSnapshot = await admin.firestore()
          .collection('stockNotifications')
          .where('productId', '==', productId)
          .where('notified', '==', false)
          .get();

        if (notificationsSnapshot.empty) {
          console.log('Nenhuma notificação pendente encontrada');
          return;
        }

        console.log(`Encontradas ${notificationsSnapshot.size} notificações pendentes`);

        // Processar cada notificação
        const promises = notificationsSnapshot.docs.map(async (doc) => {
          const notification = { id: doc.id, ...doc.data() };

          try {
            // Enviar email
            await exports.sendStockNotificationEmail({
              to: notification.email,
              productName: notification.productName,
              productUrl: `https://vitrinebella.com/produto/${productId}`,
              unsubscribeUrl: `https://vitrinebella.com/unsubscribe/${notification.id}`
            });

            // Marcar como notificado
            await doc.ref.update({
              notified: true,
              notifiedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            console.log(`Notificação enviada para ${notification.email}`);
          } catch (error) {
            console.error(`Erro ao enviar notificação para ${notification.email}:`, error);
          }
        });

        await Promise.all(promises);
        console.log('Todas as notificações foram processadas');

      } catch (error) {
        console.error('Erro ao processar notificações:', error);
      }
    }
  });
