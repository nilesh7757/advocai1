from rest_framework.decorators import api_view, parser_classes
from rest_framework.response import Response
from django.conf import settings
import json
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
import cloudinary.uploader

from .utils import get_gemini_response # Import the new utility function


@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def chat(request):
    """
    API endpoint for the conversational legal document generator.
    """
    messages = request.data.get('messages', [])
    if not messages:
        return Response({'error': 'Messages are required'}, status=400)

    user_message = messages[-1]['text'] # Assuming the last message is the current user input
    document_context = "" # The chat view doesn't inherently have document context, it's built from messages

    try:
        signature_file = request.FILES.get('signature')
        if signature_file:
            try:
                upload_result = cloudinary.uploader.upload(signature_file)
                signature_url = upload_result['secure_url']
                # Append a system message to the user's message
                user_message += f"\n\n(System: The user has uploaded a signature. Please place it in the appropriate section of the document using the following markdown: ![Signature]({signature_url}))"
            except Exception as e:
                return Response({'error': f'Error uploading signature: {e}'}, status=500)

        response_text = get_gemini_response(user_message, document_context)

        print(f"Model response text: {response_text}")

        # The response from the model is just text, so we need to parse it to see
        # if it is a question or the final document.
        # For now, we will assume that if the response contains "```json", it is the final document in JSON format.
        # Otherwise, it is a question.
        if '```json' in response_text:
            # It's the final document
            # Extract the JSON part from the response
            json_str = response_text.split('```json')[1].split('```')[0]
            document_data = json.loads(json_str)
            return Response(document_data)
        else:
            # It's a question
            return Response({'type': 'question', 'text': response_text})

    except Exception as e:
        print(f"Error in chat view: {e}")
        print(f"Type of error: {type(e)}")
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
def clause_library(request):
    """
    API endpoint that returns a list of predefined standalone legal clauses grouped by category.
    """
    clauses = [
        {
            "category": "Confidentiality",
            "title": "Mutual Confidentiality",
            "text": "Each Party agrees to keep all Confidential Information of the other Party strictly confidential. The Receiving Party shall use at least the same degree of care to avoid disclosure of the Disclosing Party's Confidential Information as it uses to protect its own confidential information of a similar nature, but in no event less than a reasonable degree of care. The Receiving Party may only disclose Confidential Information to those of its employees, consultants, and advisors who have a need to know such information and who are bound by confidentiality obligations at least as restrictive as those contained herein."
        },
        {
            "category": "Confidentiality",
            "title": "Standard Non-Disclosure",
            "text": "For the purposes of this Agreement, 'Confidential Information' shall include all information or material that has or could have commercial value or other utility in the business in which Disclosing Party is engaged. If Information is in written form, the Disclosing Party shall label or stamp the materials with the word 'Confidential' or some similar warning. The Receiving Party's obligations under this Agreement shall survive for a period of three (3) years from the date of termination or expiration of this Agreement."
        },
        {
            "category": "Arbitration & Disputes",
            "title": "Neutral Arbitration",
            "text": "Any dispute, controversy, or claim arising out of or relating to this contract, including its formation, interpretation, performance, breach, or termination, shall be referred to and finally resolved by arbitration. The arbitration shall be conducted in accordance with the Arbitration Rules of the International Chamber of Commerce (ICC) or the Arbitration and Conciliation Act, 1996 (if in India), in force at the time of commencement. The place of arbitration shall be New Delhi, India (or another mutually agreed venue). The language to be used in the arbitral proceedings shall be English. The dispute shall be resolved by a sole arbitrator appointed mutually by the Parties."
        },
        {
            "category": "Arbitration & Disputes",
            "title": "Governing Law & Jurisdiction",
            "text": "This Agreement shall be governed by, and construed in accordance with, the laws of India, without regard to its conflict of law principles. Subject to the arbitration clause, the courts of New Delhi, India shall have exclusive jurisdiction over any disputes arising out of or in connection with this Agreement."
        },
        {
            "category": "Force Majeure",
            "title": "Standard Force Majeure",
            "text": "Neither Party shall be liable for any failure or delay in performance under this Agreement to the extent said failure or delay is caused by conditions beyond its reasonable control, including but not limited to acts of God, natural disasters, war, strikes, labor disputes, government orders, epidemics, pandemics, blockades, or acts of terrorism. The affected Party shall give immediate written notice of the Force Majeure event to the other Party, detailing the nature and expected duration of the event, and shall make reasonable efforts to resume performance as soon as practicable. If the Force Majeure event persists for more than thirty (30) consecutive days, either Party may terminate this Agreement upon written notice."
        },
        {
            "category": "Force Majeure",
            "title": "Performance Excuse & Mitigation",
            "text": "In the event of a Force Majeure, the affected Party's performance obligations under this Agreement shall be suspended during the period of the Force Majeure. The affected Party shall use commercially reasonable efforts to mitigate the effects of the Force Majeure event. If the suspension of performance continues for a period exceeding forty-five (45) days, either Party may terminate this Agreement without penalty."
        },
        {
            "category": "Indemnification",
            "title": "Mutual Indemnification",
            "text": "Each Party (the 'Indemnifying Party') agrees to indemnify, defend, and hold harmless the other Party, its officers, directors, employees, and agents (collectively, the 'Indemnified Party') from and against any and all claims, damages, liabilities, losses, costs, and expenses (including reasonable attorneys' fees) arising out of or resulting from any third-party claim based on the Indemnifying Party's breach of any representation, warranty, or covenant in this Agreement, or the Indemnifying Party's gross negligence or willful misconduct."
        },
        {
            "category": "Indemnification",
            "title": "Intellectual Property Indemnity",
            "text": "The Service Provider shall defend, indemnify, and hold harmless the Client from and against any third-party claims, lawsuits, or proceedings alleging that the deliverables or services provided under this Agreement infringe any patent, copyright, trademark, or trade secret of a third party, provided that the Client promptly notifies the Service Provider in writing of the claim, gives the Service Provider sole control of the defense and settlement of the claim, and provides reasonable cooperation."
        },
        {
            "category": "Termination",
            "title": "Termination for Convenience",
            "text": "Either Party may terminate this Agreement at any time, without cause or penalty, by giving the other Party at least thirty (30) days' prior written notice. Upon termination under this section, the Client shall pay the Service Provider for all services rendered and non-refundable expenses incurred up to the effective date of termination."
        },
        {
            "category": "Termination",
            "title": "Termination for Cause",
            "text": "Either Party may terminate this Agreement immediately upon written notice if: (a) the other Party commits a material breach of this Agreement and fails to cure such breach within fifteen (15) days after receiving written notice specifying the breach; or (b) the other Party becomes insolvent, files for bankruptcy, enters liquidation, or makes an assignment for the benefit of creditors."
        },
        {
            "category": "Limitation of Liability",
            "title": "Standard Liability Cap",
            "text": "To the maximum extent permitted by applicable law, in no event shall either Party's total aggregate liability arising out of or related to this Agreement, whether in contract, tort (including negligence), strict liability, or otherwise, exceed the total amount actually paid by the Client to the Service Provider under this Agreement during the twelve (12) months preceding the event giving rise to liability."
        },
        {
            "category": "Limitation of Liability",
            "title": "Exclusion of Consequential Damages",
            "text": "In no event shall either Party be liable to the other Party for any indirect, incidental, special, exemplary, punitive, or consequential damages, including but not limited to loss of profits, loss of revenue, loss of data, or loss of business opportunity, even if such Party has been advised of the possibility of such damages in advance."
        }
    ]
    return Response(clauses, status=status.HTTP_200_OK)


@api_view(['POST'])
def refine_text(request):
    """
    Refines a given text based on the requested action: formal, simplify, favorable, shorten.
    """
    from .utils import get_llm
    from django.http import HttpResponse
    
    text = request.data.get('text', '').strip()
    action = request.data.get('action', '').strip()
    
    if not text:
        return Response({'error': 'text parameter is required'}, status=status.HTTP_400_BAD_REQUEST)
        
    if action not in ['formal', 'simplify', 'favorable', 'shorten']:
        return Response({'error': 'action must be one of: formal, simplify, favorable, shorten'}, status=status.HTTP_400_BAD_REQUEST)
        
    prompts = {
        'formal': "Rewrite the following contract clause to be more formal, precise, and professional. Maintain its original legal meaning and structure, but polish the language. Output ONLY the rewritten text, nothing else.",
        'simplify': "Rewrite the following contract clause to be simple, clear, and easy to understand for a layperson, while keeping its legal validity. Output ONLY the rewritten text, nothing else.",
        'favorable': "Rewrite the following contract clause to be more favorable to the party proposing it (protecting our interests, minimizing our liability, and maximizing our rights). Output ONLY the rewritten text, nothing else.",
        'shorten': "Rewrite the following contract clause to be shorter, more concise, and direct, removing fluff while keeping its core legal substance. Output ONLY the rewritten text, nothing else."
    }
    
    prompt = f"{prompts[action]}\n\nText to rewrite:\n{text}"
    
    try:
        model = get_llm()
        response = model.generate_content(prompt)
        rewritten_text = response.text.strip()
        
        # Clean markdown codeblocks
        if rewritten_text.startswith("```"):
            lines = rewritten_text.splitlines()
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            rewritten_text = "\n".join(lines).strip()
            
        return HttpResponse(rewritten_text, content_type='text/plain')
    except Exception as e:
        return Response({'error': f"Failed to refine text: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)