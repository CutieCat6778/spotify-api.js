import Client from './Client';
import { handleError, UnexpectedError } from './Errors';
import Track from './structures/Track';
import Artist from './structures/Artist';
import { AffinityOptions, Image, Paging, PagingOptions, RawObject } from './Types';
import Album from './structures/Album';

/**
 * A class which accesses the current user endpoints!
 */
export default class UserClient{

    client!: Client;
    
    name: string;
    country: string;
    email: string;
    externalUrls: RawObject;
    totalFollowers: number;
    href: string;
    id: string;
    images: Image[];
    product: 'premium' | 'free' | 'open' | 'unknown';
    uri: string;

    /**
     * The same client but manages current user endpoints and requires a current user api token not a token which is generated by client and client secret
     * 
     * @param token Your spotify current user token or provide your spotify client!
     * @example const user = new UserClient('token'); // or
     * const user = new UserClient(client);
     */
    constructor(client: Client);
    constructor(token: string);
    constructor(token: string | Client){
        
        this.name = '';
        this.country = '';
        this.email = 'unknown';
        this.externalUrls = {};
        this.totalFollowers = 0;
        this.product = 'unknown';
        this.images = [];
        this.uri = '';
        this.id = '';
        this.href = '';

        Object.defineProperty(this, 'client', { value: typeof token == 'string' ? new Client(token) : token });

    }

    /**
     * Returns current user details
     * 
     * @example const user = await user.info(); 
     */
    async info(): Promise<this> {

        try{
            const data = await this.client.util.fetch('/me');

            this.name = data.display_name;
            this.country = data.country || 'unknown';
            this.id = data.id;
            this.email = data.email || 'unknown';
            this.externalUrls = data.external_urls;
            this.totalFollowers = data.followers.total;
            this.href = data.href;
            this.images = data.images;
            this.product = data.product || 'unknown';
            this.uri = data.uri;
        }catch(e){
            throw new UnexpectedError(e);
        }

        return this;

    }

    /**
     * Returns the top tracks of the current user!
     * 
     * @param options Basic AffinityOptions
     * @example await user.getTopTracks();
     */
    async getTopTracks(options: AffinityOptions = {}): Promise<Paging<Track>> {

        try{
            const tracks = (await this.client.util.fetch('/me/top/tracks', { params: options as RawObject }));

            return {
                limit: tracks.limit,
                offset: tracks.offset,
                total: tracks.total,
                items: tracks.items.map(x => new Track(x, this.client))
            };;
        }catch(e){
            return handleError(e) || {
                limit: 0,
                offset: 0,
                total: 0,
                items: []
            };
        }

    }

    /**
     * Returns the top artists of the current user!
     * 
     * @param options Basic AffinityOptions
     * @example await user.getTopArtists();
     */
    async getTopArtists(options: AffinityOptions = {}): Promise<Paging<Artist>> {

        try{
            const artists = (await this.client.util.fetch('/me/top/artists', {  params: options as RawObject }));

            return {
                limit: artists.limit,
                offset: artists.offset,
                total: artists.total,
                items: artists.items.map(x => new Artist(x, this.client))
            };
        }catch(e){
            return handleError(e) || {
                limit: 0,
                offset: 0,
                total: 0,
                items: []
            };
        }

    }

    /**
     * Follow a playlist inshort words add the playlist to your library!
     * 
     * @param id The id of the playlist!
     * @param options Options such as public!
     * @example await client.user.followPlaylist('id');
     */
    async followPlaylist(id: string, options: {
        public?: boolean;
    } = { public: true }): Promise<boolean> {

        try{
            await this.client.util.fetch(`/playlists/${id}/followers`, {
                method: 'PUT',
                headers: {
                    "Content-Type": "application/json"
                },
                body: {
                    public: options.public ||true
                }
            });

            return true;
        }catch(e){
            return handleError(e) || false;
        }

    }

    /**
     * Unfollow a playlist by id!
     * 
     * @param id The id of the playlist!
     * @example await client.user.unfollowPlaylist('id');
     */
    async unfollowPlaylist(id: string): Promise<boolean> {

        try{
            await this.client.util.fetch(`/playlists/${id}/followers`, { method: 'DELETE' });
            return true;
        }catch(e){
            return handleError(e) || false;
        }

    }

    /**
     * Verify if the current user follows a paticualr playlist by id!
     * 
     * @param id Spotify playlist id
     * @example const follows = await client.user.followsPlaylist('id');
     */
    async followsPlaylist(id: string): Promise<boolean> {
        return (await this.client.playlists.userFollows(id, this.id))[0] || false;
    }

    /**
     * Returns the user's following list of artists!
     * 
     * @param options Options such as after and limit!
     * @example const artists = await client.user.getFollowingArtists();
     */
    async getFollowingArtists(options?: {
        after?: string;
        limit?: number;
    }): Promise<Paging<Artist>> {

        try{
            const artists = (await this.client.util.fetch('/me/following', {
                params: {
                    ...options as RawObject,
                    type: 'artist'
                }
            })).artists;

            return {
                limit: artists.limit,
                offset: artists.offset,
                total: artists.total,
                items: artists.items.map(x => new Artist(x, this.client))
            };
        }catch(e){
            return handleError(e) || {
                limit: 0,
                offset: 0,
                total: 0,
                items: []
            };
        }

    }

    /**
     * Follow artists with their spotify ids!
     * 
     * @param ids An array of spotify artist ids
     * @example await client.user.followArtists('id1', 'id2');
     */
    async followArtists(...ids: string[]): Promise<boolean> {

        try{
            await this.client.util.fetch(`/me/following`, {
                method: 'PUT',
                params: {
                    type: 'artist',
                    ids: ids.join(',')
                }
            });

            return true;
        }catch(e){
            return handleError(e) || false;
        }

    }

    /**
     * Unfollow artists with their spotify ids!
     * 
     * @param ids An array of spotify artist ids
     * @example await client.user.unfollowArtists('id1', 'id2');
     */
    async unfollowArtists(...ids: string[]): Promise<boolean> {

        try{
            await this.client.util.fetch(`/me/following`, {
                method: 'DELETE',
                params: {
                    type: 'artist',
                    ids: ids.join(',')
                }
            });

            return true;
        }catch(e){
            return handleError(e) || false;
        }

    }

    /**
     * Follow users with their spotify ids!
     * 
     * @param ids An array of spotify user ids
     * @example await client.user.followUsers('id1', 'id2');
     */
    async followUsers(...ids: string[]): Promise<boolean> {

        try{
            await this.client.util.fetch(`/me/following`, {
                method: 'PUT',
                params: {
                    type: 'user',
                    ids: ids.join(',')
                }
            });

            return true;
        }catch(e){
            return handleError(e) || false;
        }

    }

    /**
     * Unfollow users with their spotify ids!
     * 
     * @param ids An array of spotify user ids
     * @example await client.user.unfollowUsers('id1', 'id2');
     */
    async unfollowUsers(...ids: string[]): Promise<boolean> {

        try{
            await this.client.util.fetch(`/me/following`, {
                method: 'DELETE',
                params: {
                    type: 'user',
                    ids: ids.join(',')
                }
            });

            return true;
        }catch(e){
            return handleError(e) || false;
        }

    }

    /**
     * Verify if the array of artists supplied is been followed by you!
     * 
     * @param ids Array of spotify artist ids
     * @example const [followsArtist] = await client.user.followsArtists('id1');
     */
    async followsArtists(...ids: string[]): Promise<boolean[]> {

        try{
            return await this.client.util.fetch(`/me/following/contains`, {
                params: {
                    type: 'artist',
                    ids: ids.join(',')
                }
            })
        }catch(e){
            return handleError(e) || [];
        }

    }

    /**
     * Verify if the array of users supplied is been followed by you!
     * 
     * @param ids Array of spotify users ids
     * @example const [followsUser] = await client.user.followsUsers('id1');
     */
    async followsUsers(...ids: string[]): Promise<boolean[]> {

        try{
            return await this.client.util.fetch(`/me/following/contains`, {
                params: {
                    type: 'user',
                    ids: ids.join(',')
                }
            })
        }catch(e){
            return handleError(e) || [];
        }

    }

    /**
     * Returns the saved albums of the current user
     * 
     * @param options Basic PagingOptions
     * @example const albums = await client.user.getAlbums();
     */
    async getAlbums(options?: PagingOptions): Promise<Paging<Album>> {

        try{
            const data = await this.client.util.fetch('/me/albums', { params: options });

            return {
                limit: data.limit,
                offset: data.offset,
                total: data.total,
                items: data.items.map(x => new Album(x, this.client))
            }
        }catch(e){
            return handleError(e) || {
                limit: 0,
                offset: 0,
                total: 0,
                items: []
            };
        }

    }

    /**
     * Add albums to your spotify savelist!
     * 
     * @param ids Spotify albums ids to add to your save list!
     * @example await client.user.addAlbums('id1', 'id2');
     */
    async addAlbums(...ids: string[]): Promise<boolean> {

        try{
            await this.client.util.fetch('/me/albums', {
                method: 'PUT',
                params: {
                    ids: ids.join(',')
                }
            })

            return true;
        }catch(e){
            return handleError(e) || false;
        }

    }

    /**
     * Remove albums from your spotify savelist!
     * 
     * @param ids Spotify albums ids to remove from your save list!
     * @example await client.user.deleteAlbums('id1', 'id2');
     */
    async deleteAlbums(...ids: string[]): Promise<boolean> {

        try{
            await this.client.util.fetch('/me/albums', {
                method: 'DELETE',
                params: {
                    ids: ids.join(',')
                }
            })

            return true;
        }catch(e){
            return handleError(e) || false;
        }

    }

    /**
     * Check if those albums exist on the current user's library!
     * 
     * @param ids Array of spotify album ids
     * @example const [hasFirstAlbum, hasSecondAlbum] = await client.user.hasAlbums('id1', 'id2');
     */
    async hasAlbums(...ids: string[]): Promise<boolean[]> {

        try{
            return await this.client.util.fetch('/me/albums/contains', {
                params: {
                    ids: ids.join(',')
                }
            })
        }catch(e){
            return handleError(e) || [];
        }

    }

};