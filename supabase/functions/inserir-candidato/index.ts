import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const body = await req.json()
    console.log('Received data from n8n:', JSON.stringify(body, null, 2))

    // Extrair dados do JSON do n8n
    const respostas = body.respostas
    
    if (!respostas) {
      console.error('Missing respostas object')
      return new Response(
        JSON.stringify({ error: 'Campo "respostas" é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validar campos obrigatórios
    if (!respostas.vaga || !respostas.nome) {
      console.error('Missing required fields:', { vaga: respostas.vaga, nome: respostas.nome })
      return new Response(
        JSON.stringify({ error: 'Campos "vaga" e "nome" são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Buscar vaga_id pelo título
    const { data: vaga, error: vagaError } = await supabase
      .from('vagas')
      .select('id')
      .eq('titulo', respostas.vaga)
      .maybeSingle()

    if (vagaError) {
      console.error('Error fetching vaga:', vagaError)
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar vaga', details: vagaError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Vaga found:', vaga)

    // Preparar dados para inserção
    const candidatoData = {
      nome: respostas.nome,
      vaga_id: vaga?.id || null,
      vaga_titulo: respostas.vaga,
      resumo_experiencia: respostas.resumo_experiencia || null,
      interesse_remoto: respostas.interesse_remoto || null,
      feedback_final: respostas.feedback_final || null,
      fit_cultural: respostas.fit_cultural || null,
      respostas_personalizadas: respostas.respostas_personalizadas || null,
      dados_completos: body, // Salvar JSON completo para auditoria
      status: 'qualificado'
    }

    console.log('Inserting candidato:', candidatoData)

    // Inserir candidato
    const { data: candidato, error: insertError } = await supabase
      .from('candidatos')
      .insert(candidatoData)
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting candidato:', insertError)
      return new Response(
        JSON.stringify({ error: 'Erro ao inserir candidato', details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Candidato inserted successfully:', candidato)

    return new Response(
      JSON.stringify({ 
        success: true, 
        candidato,
        message: `Candidato ${respostas.nome} cadastrado com sucesso!` 
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in inserir-candidato function:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
