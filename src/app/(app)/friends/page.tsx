"use client";

import FriendActivitySummary from "@/components/friends/FriendActivitySummary";
import FriendInviteForm from "@/components/friends/FriendInviteForm";
import FriendTransferForm from "@/components/friends/FriendTransferForm";
import FriendsList from "@/components/friends/FriendsList";
import IncomingRequestsList from "@/components/friends/IncomingRequestsList";
import RecentTransfersList from "@/components/friends/RecentTransfersList";
import { FeedbackBanner } from "@/components/ui/FeedbackBanner";
import PageLoading from "@/components/ui/PageLoading";
import { useFriendsPage } from "@/hooks/useFriendsPage";

export default function FriendsPage() {
  const friends = useFriendsPage();

  if (friends.loading) {
    return <PageLoading label="جاري تحميل العلاقات..." />;
  }

  return (
    <div className="space-y-6">
      <FriendInviteForm
        inviteEmail={friends.inviteEmail}
        relationshipType={friends.relationshipType}
        shareMyActivity={friends.shareMyActivity}
        submitting={friends.submitting}
        onInviteEmailChange={friends.setInviteEmail}
        onRelationshipTypeChange={friends.setRelationshipType}
        onShareMyActivityChange={friends.setShareMyActivity}
        onSubmit={friends.handleInvite}
      />

      <IncomingRequestsList requests={friends.incomingRequests} onRespond={friends.handleRespond} />

      <section className="grid gap-6 xl:grid-cols-2">
        <FriendsList
          friendships={friends.acceptedFriends}
          currentUserId={friends.currentUserId}
          selectedFriendId={friends.selectedFriendId}
          onSelectFriend={friends.handleSelectFriend}
          onViewActivity={friends.handleViewActivity}
        />

        <div className="space-y-6">
          {friends.selectedFriendId ? (
            <FriendTransferForm
              myWallets={friends.myWallets}
              friendWallets={friends.friendWallets}
              senderWalletId={friends.senderWalletId}
              receiverWalletId={friends.receiverWalletId}
              transferAmount={friends.transferAmount}
              transferNote={friends.transferNote}
              submitting={friends.submitting}
              onSenderWalletChange={friends.setSenderWalletId}
              onReceiverWalletChange={friends.setReceiverWalletId}
              onTransferAmountChange={friends.setTransferAmount}
              onTransferNoteChange={friends.setTransferNote}
              onSubmit={friends.handleTransfer}
            />
          ) : null}

          {friends.friendActivity ? (
            <FriendActivitySummary activity={friends.friendActivity} currency={friends.currency} />
          ) : null}
        </div>
      </section>

      <RecentTransfersList
        transfers={friends.transfers}
        currentUserId={friends.currentUserId}
        currency={friends.currency}
      />

      <FeedbackBanner error={friends.error} message={friends.message} />
    </div>
  );
}
