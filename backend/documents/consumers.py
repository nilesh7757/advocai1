import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from .comment_mongo_client import get_comments_for_document

class DocumentConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.document_id = self.scope['url_route']['kwargs']['document_id']
        self.document_group_name = f'document_{self.document_id}'

        # Join document group
        await self.channel_layer.group_add(
            self.document_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave document group
        await self.channel_layer.group_discard(
            self.document_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get('type')
        print(f"Backend: Received WebSocket message: {data}") # Debug log

        if message_type == 'new_comment':
            # This part is typically handled by the HTTP POST API,
            # but if we want to create comments via WebSocket,
            # we would add logic here. For now, we'll assume comments
            # are created via HTTP and then broadcasted.
            pass
        elif message_type == 'fetch_comments':
            # Send existing comments to the newly connected client
            comments = await sync_to_async(get_comments_for_document)(self.document_id)
            await self.send(text_data=json.dumps({
                'type': 'comments_list',
                'comments': comments
            }))
        elif message_type == 'document_content_change':
            print(f"Backend: Broadcasting document_content_change to group {self.document_group_name}") # Debug log
            # Broadcast the document content change to other clients in the group
            await self.channel_layer.group_send(
                self.document_group_name,
                {
                    'type': 'document_content_change',
                    'content': data['content'],
                    'sender_channel_name': self.channel_name # Include sender's channel name
                }
            )

    async def new_comment(self, event):
        comment = event['comment']
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'new_comment',
            'comment': comment
        }))

    async def document_content_change(self, event):
        # Send document content change to WebSocket if not from the sender
        if self.channel_name != event['sender_channel_name']:
            print(f"Backend: Sending document_content_change to channel {self.channel_name}") # Debug log
            await self.send(text_data=json.dumps({
                'type': 'document_content_change',
                'content': event['content']
            }))
