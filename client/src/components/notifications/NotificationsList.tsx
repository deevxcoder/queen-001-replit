import React from 'react';
import { useWebSocketContext } from '@/context/websocket-context';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, CheckCircle, AlertCircle, Info, DollarSign, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// Helper function to get icon based on notification type
const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'wallet_update':
      return <DollarSign className="h-4 w-4 text-emerald-500" />;
    case 'transaction_status':
      return <DollarSign className="h-4 w-4 text-blue-500" />;
    case 'market_result':
      return <TrendingUp className="h-4 w-4 text-amber-500" />;
    case 'option_game_result':
      return <TrendingUp className="h-4 w-4 text-purple-500" />;
    default:
      return <Info className="h-4 w-4" />;
  }
};

// Helper function to get badge based on notification status
const getStatusBadge = (status?: string) => {
  if (!status) return null;
  
  switch (status) {
    case 'approved':
      return <Badge className="bg-emerald-500 hover:bg-emerald-600">Approved</Badge>;
    case 'rejected':
      return <Badge className="bg-red-500 hover:bg-red-600">Rejected</Badge>;
    case 'pending':
      return <Badge className="bg-amber-500 hover:bg-amber-600">Pending</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

const NotificationsList: React.FC = () => {
  const { notifications } = useWebSocketContext();
  
  if (notifications.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>Real-time updates will appear here</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-8 text-center text-muted-foreground">
            <Info className="h-8 w-8 mx-auto mb-2" />
            <p>No notifications yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notifications
        </CardTitle>
        <CardDescription>
          {notifications.length} recent notification{notifications.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {notifications.map((notification, index) => (
              <Card key={index} className="border border-border bg-card/50">
                <CardHeader className="p-4 pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      {getNotificationIcon(notification.type)}
                      <CardTitle className="text-sm font-medium">
                        {notification.type === 'wallet_update' && 'Wallet Updated'}
                        {notification.type === 'transaction_status' && 'Transaction Status'}
                        {notification.type === 'market_result' && 'Market Result'}
                        {notification.type === 'option_game_result' && 'Game Result'}
                      </CardTitle>
                    </div>
                    {notification.status && getStatusBadge(notification.status)}
                  </div>
                  <CardDescription className="text-xs">
                    {formatDistanceToNow(new Date(), { addSuffix: true })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-sm">{notification.message}</p>
                  
                  {/* Show additional details based on notification type */}
                  {notification.type === 'transaction_status' && notification.amount && (
                    <p className="text-xs mt-2 text-muted-foreground">
                      Amount: ₹{notification.amount.toFixed(2)}
                      {notification.newBalance !== undefined && (
                        <> | New Balance: ₹{notification.newBalance.toFixed(2)}</>
                      )}
                    </p>
                  )}
                  
                  {notification.type === 'option_game_result' && (
                    <p className="text-xs mt-2 text-muted-foreground">
                      Winning Team: {notification.winningTeam}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default NotificationsList;